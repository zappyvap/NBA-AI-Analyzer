import datetime
import pandas as pd
import os
import json
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader, Settings
from llama_index.llms.openai import OpenAI
from llama_index.experimental.query_engine import PandasQueryEngine
from langchain_openai import ChatOpenAI
from langchain.agents import create_agent
from langchain_core.tools import Tool
from dotenv import load_dotenv
from nba_data import getPlayerStats
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_community.chat_message_histories import ChatMessageHistory
from nba_data import getTeamStats
from nba_data import get_live_standings
from nba_data import get_stat_leaders
from nba_data import get_player_stats_on_date
from betting_engine import player_props

load_dotenv()

# Global configurations
Settings.llm = OpenAI(model="gpt-4o-mini")
llm_langchain = ChatOpenAI(model='gpt-4o-mini')

# Load DataFrames
df_stats = pd.read_csv("./data/Player Per Game.csv")
team_df_stats = pd.read_csv("./data/Team Stats Per Game.csv")

# Initialize Query Engines
team_query_engine = PandasQueryEngine(df=team_df_stats, verbose=True)
player_query_engine = PandasQueryEngine(df=df_stats, verbose=True)

# Define Tools with updated descriptions to avoid date anchoring
tools = [
    Tool(
        name="NBA_Player_Database",
        func=lambda q: str(player_query_engine.query(q)),
        description="Useful for when you need to answer questions about NBA player stats from historical or past completed seasons."
    ),
    Tool(
        name="NBA_Team_Database",
        func=lambda q: str(team_query_engine.query(q)),
        description="Useful for when you need to answer questions about NBA team stats from historical or past completed seasons."
    ),
    Tool(
        name="Current_NBA_Player_Database",
        func=getPlayerStats,
        description="Useful for when you need to answer questions regarding NBA Player stats for the current active NBA season."
    ),
    Tool(
        name="Current_NBA_Team_Database",
        func=getTeamStats,
        description="Useful for when you need to answer questions regarding NBA Team stats for the current active NBA season."
    ),
    get_player_stats_on_date
]

# used for storage of the previous messages
message_history = ChatMessageHistory()

app = FastAPI()

origins = [ # viable URLS
    "http://localhost:5174",
    "http://localhost:5173",
    "https://nba-ai-analyzer-frontend.onrender.com"
]

app.add_middleware( # CORS stuff
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatMessage(BaseModel):
    message: str

class PlayerPropRequest(BaseModel):
    playerName: str
    playerTeam: str
    propType: str
    line: str
    opponent: str

@app.post("/chat")
async def handle_chat(input: ChatMessage):
    query = input.message

    # REFRESH DATE AND AGENT ON EVERY REQUEST
    # This prevents the "Today is March 24th" or "Yesterday is in 2023" errors.
    today_str = datetime.datetime.now().strftime("%Y-%m-%d")
    
    # Re-initialize the agent inside the route to inject the fresh date
    current_agent = create_agent(
        tools=tools, 
        model=llm_langchain, 
        system_prompt=f"You are a helpful professional NBA analyst. Answer the user's questions using the provided tools. Use the chat history to maintain context. Today is {today_str}"
    )

    # Manage History
    message_history.add_user_message(query)
    history_messages = message_history.messages

    # Invoke the freshly created agent
    response = current_agent.invoke({"messages": history_messages})
    ai_reply = response['messages'][-1].content
    
    message_history.add_ai_message(ai_reply)
    return {"reply": ai_reply}

@app.get("/standings")
async def handle_standings():
    df = get_live_standings()
    return df

@app.get("/league-leaders")
async def handle_league_leaders():
    data = get_stat_leaders()
    return data

@app.post("/player_props")
async def handle_player_prop(request: PlayerPropRequest):
    try:
        result = player_props(
            player_name=request.playerName,
            player_team=request.playerTeam,
            propLabel=request.propType,
            line=request.line,
            opponent=request.opponent
        )
        
        # If player_props returns a JSON string, parse it
        if isinstance(result, str):
            result = json.loads(result)
        
        return result
        
    except json.JSONDecodeError as e:
        print(f"JSON parsing error: {e}")
        raise HTTPException(status_code=500, detail="Failed to parse analysis result")
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
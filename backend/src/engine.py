import datetime
import os
import pandas as pd
import json
from llama_index.core import Settings
from llama_index.llms.openai import OpenAI
from llama_index.experimental.query_engine import PandasQueryEngine
from langchain_openai import ChatOpenAI
from langchain.agents import create_agent
from langchain_core.tools import Tool
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_community.chat_message_histories import ChatMessageHistory
import asyncio
from functools import partial
# Import using the full path to avoid ModuleNotFoundError
from backend.src.nba_data import getPlayerStats, getTeamStats, get_live_standings, get_stat_leaders, get_player_stats_on_date
from backend.src.betting_engine import player_props

# 1. Fetch the key ONCE
api_key = os.getenv("OPENAI_API_KEY")

# 2. Initialize models ONCE with the key
# Removed the second set of initializations that were overwriting these
Settings.llm = OpenAI(model="gpt-4o-mini", api_key=api_key)
llm_langchain = ChatOpenAI(model='gpt-4o-mini', openai_api_key=api_key)

# 3. Load DataFrames with absolute paths
# Fixed the typo in the second path (.app -> /app)
df_stats = pd.read_csv("/app/data/Player Per Game.csv")
team_df_stats = pd.read_csv("/app/data/Team Stats Per Game.csv")

# Initialize Query Engines
team_query_engine = PandasQueryEngine(df=team_df_stats, verbose=True)
player_query_engine = PandasQueryEngine(df=df_stats, verbose=True)

# Define Tools
tools = [
    Tool(
        name="NBA_Player_Database",
        func=lambda q: str(player_query_engine.query(q)),
        description="Useful for stats from historical or past seasons."
    ),
    Tool(
        name="NBA_Team_Database",
        func=lambda q: str(team_query_engine.query(q)),
        description="Useful for team stats from historical or past seasons."
    ),
    Tool(
        name="Current_NBA_Player_Database",
        func=getPlayerStats,
        description="Useful for current 2025-26 NBA season player stats."
    ),
    Tool(
        name="Current_NBA_Team_Database",
        func=getTeamStats,
        description="Useful for current 2025-26 NBA season team stats."
    ),
    get_player_stats_on_date
]

message_history = ChatMessageHistory()

app = FastAPI()

origins = [
    "http://localhost:5174",
    "http://localhost:5173",
    "https://nba-ai-analyzer-frontend.onrender.com",
    "https://*.hf.space",
]

app.add_middleware(
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
    today_str = datetime.datetime.now().strftime("%Y-%m-%d")
    
    current_agent = create_agent(
        tools=tools, 
        model=llm_langchain, 
        system_prompt=f"You are a helpful professional NBA analyst. Today is {today_str}"
    )

    message_history.add_user_message(query)
    response = current_agent.invoke({"messages": message_history.messages})
    ai_reply = response['messages'][-1].content
    
    message_history.add_ai_message(ai_reply)
    return {"reply": ai_reply}

@app.get("/standings")
async def handle_standings():
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, get_live_standings)
    return result

@app.get("/league_leaders")
async def handle_league_leaders():
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, get_stat_leaders)
    return result

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
        if isinstance(result, str):
            result = json.loads(result)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
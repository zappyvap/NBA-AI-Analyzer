import datetime
import pandas as pd
import os
from llama_index.core import VectorStoreIndex,SimpleDirectoryReader,Settings
from llama_index.llms.openai import OpenAI
from llama_index.experimental.query_engine import PandasQueryEngine
from langchain_openai import ChatOpenAI
from langchain.agents import create_agent
from langchain_core.tools import Tool
from dotenv import load_dotenv
from nba_data import getPlayerStats
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.runnables.history import GetSessionHistoryCallable
from nba_data import getTeamStats
from nba_data import get_live_standings
from nba_data import get_stat_leaders
from nba_data import get_player_stats_on_date

load_dotenv()

Settings.llm=OpenAI(model="gpt-4o-mini") # initializes the llm that llamaindex uses
llm_langchain = ChatOpenAI(model='gpt-4o-mini') # initializes the llm that langchain uses
#documents = SimpleDirectoryReader('./backend/src/data').load_data() # loads data for llamaindex to use
#index = VectorStoreIndex.from_documents(documents) # indexes the data


df_stats = pd.read_csv("./data/Player Per Game.csv")

team_df_stats= pd.read_csv("./data/Team Stats Per Game.csv")

team_query_engine = PandasQueryEngine(df=team_df_stats, verbose = True) # query engine for the team stats
player_query_engine = PandasQueryEngine(df=df_stats,verbose = True) # makes the data a query engine for players

tools = [ # this wraps the llamaindex database into a tool that langchain can use
    Tool(
        name="NBA_Player_Database",
        func=lambda q: str(player_query_engine.query(q)),#llamaindex engine
        description="Useful for when you need to answer questions about NBA player stats from past seasons, 2024-2025 season and before"
    ),
    Tool(
        name="NBA_Team_Database",
        func=lambda q: str(team_query_engine.query(q)),#llamaindex engine
        description="Useful for when you need to answer questions about NBA team stats from past seasons, 2024-2025 season and before"
    ),
    Tool(
        name="Current_NBA_Player_Database",
        func=getPlayerStats,#backend function
        description="Useful for when you need to answer questions regarding NBA Player stats for this current year of NBA, the 2025-2026 NBA Season."
    ),
    Tool(
        name="Current_NBA_Team_Database",
        func=getTeamStats,#backend function
        description="Useful for when you need to answer questions regarding NBA Team stats for this current year of NBA, the 2025-2026 NBA Season."
    ),
    get_player_stats_on_date
    
]

message_history = ChatMessageHistory()
today = datetime.datetime.now().strftime("%Y-%m-%d")
#this just creates the langchain agent with the llm it needs and the tools
agent = create_agent(tools=tools, model=llm_langchain, system_prompt="You are a helpful professional NBA analyst. Answer the user's questions using the provided tools. Use the chat history to maintain context. Today is {today}")


app = FastAPI()


origins = [ # will need to add the url for the rendering site
    "http://localhost:5174",
    "http://localhost:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials = True,
    allow_methods=["*"],
    allow_headers=["*"],
)


#print("Agent Response Keys:", response.keys())
#print(response["messages"][-1].content)

class ChatMessage(BaseModel):
    message:str

@app.post("/chat")
async def handle_chat(input:ChatMessage): # takes in dictionary with {message : "___"} as the typing
    query = input.message

    message_history.add_user_message(query)
    history_messages = message_history.messages

    response = agent.invoke({"messages": history_messages})
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
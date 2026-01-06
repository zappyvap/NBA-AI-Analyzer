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
import uvicorn
from pydantic import BaseModel

load_dotenv()

Settings.llm=OpenAI(model="gpt-4o-mini") # initializes the llm that llamaindex uses
llm_langchain = ChatOpenAI(model='gpt-4o-mini') # initializes the llm that langchain uses
#documents = SimpleDirectoryReader('./backend/src/data').load_data() # loads data for llamaindex to use
#index = VectorStoreIndex.from_documents(documents) # indexes the data


df_stats = pd.read_csv("./data/Player Per Game.csv")

query_engine = PandasQueryEngine(df=df_stats,verbose = True) # makes the data a query engine

tools = [ # this wraps the llamaindex database into a tool that langchain can use
    Tool(
        name="NBA_Player_Database",
        func=lambda q: str(query_engine.query(q)),
        description="Useful for when you need to answer questions about NBA player stats from past seasons, 2024-2025 season and before"
    ),
    Tool(
        name="Current_NBA_Player_Database",
        func=getPlayerStats,
        description="Useful for when you need to answer questions regarding NBA Player stats for this current year of NBA, the 2025-2026 NBA Season."
    )
    # add tool for team stuff
]

#this just creates the langchain agent with the llm it needs and the tools
agent = create_agent(tools=tools, model=llm_langchain, system_prompt="You are a helpful professional NBA analyst. Answer the user's questions using the provided tools")


app = FastAPI()

response = agent.invoke({"messages": [{"role": "user", "content": "Whos the greatest player of all time?"}]})

origins = [ # will need to add the url for the rendering site
    "http://localhost:5174"
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
    response = agent.invoke({"messages": [{"role": "user", "content": query}]})
    return {"reply": response["messages"][-1].content}

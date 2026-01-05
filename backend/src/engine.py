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

load_dotenv()

Settings.llm=OpenAI(model="gpt-4o-mini") # initializes the llm that llamaindex uses
llm_langchain = ChatOpenAI(model='gpt-4o-mini') # initializes the llm that langchain uses
#documents = SimpleDirectoryReader('./backend/src/data').load_data() # loads data for llamaindex to use
#index = VectorStoreIndex.from_documents(documents) # indexes the data
CSV_PATH = "./backend/src/data/Player Per Game.csv"
PICKLE_PATH = CSV_PATH.replace(".csv", ".pkl")

def get_data(): 
    # If the fast-load version exists, use it
    if os.path.exists(PICKLE_PATH):
        return pd.read_pickle(PICKLE_PATH)
    
    # Otherwise, load the slow way and save for next time
    df = pd.read_csv(CSV_PATH)
    df.to_pickle(PICKLE_PATH)
    return df

df_stats = get_data()

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


response = agent.invoke({"messages": [{"role": "user", "content": "Whos the greatest player of all time?"}]})
print("Agent Response Keys:", response.keys())
print(response["messages"][-1].content)
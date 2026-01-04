import pandas as pd
from llama_index.core import VectorStoreIndex,SimpleDirectoryReader,Settings
from llama_index.llms.openai import OpenAI
from llama_index.experimental.query_engine import PandasQueryEngine
from langchain_openai import ChatOpenAI
from langchain.agents import create_agent
from langchain_core.tools import Tool
from dotenv import load_dotenv

load_dotenv()

Settings.llm=OpenAI(model="gpt-4o-mini") # initializes the llm that llamaindex uses
llm_langchain = ChatOpenAI(model='gpt-4o-mini') # initializes the llm that langchain uses
#documents = SimpleDirectoryReader('./backend/src/data').load_data() # loads data for llamaindex to use
#index = VectorStoreIndex.from_documents(documents) # indexes the data
df_stats = pd.read_csv("./backend/src/data/Player Per Game.csv")
query_engine = PandasQueryEngine(df=df_stats,verbose = True) # makes the data a query engine

tools = [ # this wraps the llamaindex database into a tool that langchain can use
    Tool(
        name="NBA_Player_Database",
        func=lambda q: str(query_engine.query(q)),
        description="Useful for when you need to answer questions about NBA player stats from past seasons, 2024-2025 season and before"
    )
    # add tool for the current season nba stats using the api
    # add tool that calculates points per game and stuff
]

#this just creates the langchain agent with the llm it needs and the tools
agent = create_agent(tools=tools, model=llm_langchain, system_prompt="You are a helpful professional NBA analyst. Answer the user's questions using the provided tools")

response = agent.invoke({"messages": [{"role": "user", "content": "What are LeBron's 2023 stats?"}]})
print("Agent Response Keys:", response.keys())
print(response["messages"][-1].content)
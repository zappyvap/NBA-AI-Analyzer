from llama_index.core import VectorStoreIndex,SimpleDirectoryReader,Settings
from llama_index.llms.openai import OpenAI
from langchain_openai import ChatOpenAI
from langchain.agents import initialize_agent, Tool

Settings.llm=OpenAI(model="gpt-4o")
llm_langchain = ChatOpenAI(model='gpt-4o')
documents = SimpleDirectoryReader('./data').load_data()
index = VectorStoreIndex.from_documents(documents)
query_engine = index.as_query_engine()

tools = [
    Tool(
        name="NBA_Database",
        func=lambda q: str(query_engine.query(q)),
        description="Useful for when you need to answer questions about NBA player stats from our local files."
    )
]

# --- THE NARRATOR (LangChain Agent) ---
agent = initialize_agent(tools, llm_langchain, agent="zero-shot-react-description", verbose=True)
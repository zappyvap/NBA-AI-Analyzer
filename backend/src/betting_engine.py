from langchain_openai import ChatOpenAI
from langchain.agents import create_agent
from langchain_core.tools import Tool
from dotenv import load_dotenv
from nba_data import getPlayerStats,getTeamStats,getLastTenGames,getLastMatchup,getInjuryReport

load_dotenv()

def player_props(player_name,propLabel,opponent,line):
    prompt = f"""

    IMPORTANT: You MUST analyze {player_name}, NOT any other player.
    CRITICAL: You MUST ONLY analyze the EXACT player name provided in the user's request. 
    When calling tools, use the EXACT player name string: "{player_name}"
    
    If any tool returns data for a different player, stop and report an error.
    
    Player: {player_name}
    Prop: {propLabel} Over/Under {line}
    Opponent: {opponent}

    STEP 1: Call Player_Per_Game_Stats with player name "{player_name}" to get their current season stats.
    STEP 2: Call Last_Ten_Games_Stats with player name "{player_name}" to get recent form.
    STEP 3: Call Team_Stats for "{opponent}" to understand their defense.
    STEP 4: Call Injury_Report for "{opponent}" to know the injury reports. You should also do this for {player_name}'s team as well.
    STEP 4: Analyze the data you received for {player_name} ONLY.

    Provide a comprehensive analysis covering:
    1. Player's recent performance and season averages for this stat
    2. Historical performance against this opponent
    3. Opponent's defensive ranking/tendencies for this stat category
    4. Recent trends (hot/cold streak, minutes played, usage rate)
    5. Injury concerns or roster changes affecting the prop
    6. Matchup advantages or disadvantages
    7. Pace of play and game environment factors
    8. Final recommendation: Over or Under with confidence level

    You MUST return ONLY valid JSON in this EXACT structure (no other text):
    {{
      "playerForm": "detailed analysis of {player_name}'s recent form and season stats",
      "matchupAnalysis": "how {opponent} defends this stat category",
      "keyFactors": ["factor1", "factor2", "factor3", "factor4"],
      "trends": "recent trends affecting this prop for {player_name}",
      "recommendation": {{
        "pick": "Over or Under",
        "reasoning": "detailed explanation why for {player_name}",
        "confidence": "Low, Medium, or High",
        "projectedStat": "estimated number"
      }}
    }}
    
    DO NOT include any text before or after the JSON. Return ONLY the JSON object.
    """

    llm_langchain = ChatOpenAI(model='gpt-4o-mini')

    
    tools=[
        Tool(
            name="Player_Per_Game_Stats",
            func=getPlayerStats,
            description="Use this when you need to get the current season per game stats for a player"
        ),
        Tool(
            name="Team_Stats",
            func=getTeamStats,
            description="Use this when you need to get the current season stats for an NBA Team."
        ),
        Tool(
            name="Last_Ten_Games_Stats",
            func=getLastTenGames,
            description="Use this when you need to get stats for a player based on his last 10 games."
        ),
        getLastMatchup,
        Tool(
            name="Injury_Report",
            func=getInjuryReport,
            description="Use this when you want to get the injury report on a team."
        )
    ]
    agent = create_agent(
        tools=tools,
        model=llm_langchain,
        system_prompt="You are a professional sports betting analyst specializing in NBA player props. Analyze prop bets and provide detailed insights. First, use your tools to gather all necessary data. Only after you have all the information should you provide the final response in the requested JSON format."
    )
    response = agent.invoke({'input': prompt})
    return response['messages'][-1].content


print(player_props(player_name="LeBron James", propLabel="Points", opponent="Nuggets", line="20.5"))


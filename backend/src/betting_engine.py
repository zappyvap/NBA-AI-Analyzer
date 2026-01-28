from langchain_openai import ChatOpenAI
from dotenv import load_dotenv
from nba_data import getPlayerStats,getTeamStats,getLastTenGames,getLastMatchup,getInjuryReport
import re

load_dotenv()

def player_props(player_name, player_team, propLabel, opponent, line):
    # get data from other functions
    player_stats = getPlayerStats(player_name)
    last_ten = getLastTenGames(player_name)
    opponent_stats = getTeamStats(opponent)
    opponent_injuries = getInjuryReport(opponent)
    player_team_injuries = getInjuryReport(player_team)
    
    # prompt langchain with said data
    analysis_prompt = f"""
    Analyze this NBA player prop bet and return ONLY valid JSON (no other text, no markdown, no code blocks):
    
    Player: {player_name}
    Player Team: {player_team}
    Prop: {propLabel} Over/Under {line}
    Opponent: {opponent}
    

    If Prop is more than one category, ex. "Pts+reb+ast" that means a combination of the 3 is the bet.

    DATA:
    Player Season Stats: {player_stats}
    Player Last 10 Games: {last_ten}
    Opponent Team Stats: {opponent_stats}
    Opponent Injuries: {opponent_injuries}
    Player's Team's Injuries: {player_team_injuries}
    
    CRITICAL: Do NOT wrap your response in ```json or ``` markers. Return ONLY the raw JSON object.
    
    Return ONLY this JSON structure:
    {{
      "playerForm": "analysis of recent form and season stats",
      "matchupAnalysis": "how opponent defends this category",
      "keyFactors": ["factor1", "factor2", "factor3", "factor4"],
      "trends": "recent trends",
      "recommendation": {{
        "pick": "Over or Under",
        "reasoning": "explanation",
        "confidence": "Low/Medium/High",
        "projectedStat": "number"
      }}
    }}
    """
    
    llm = ChatOpenAI(model='gpt-4o-mini')
    response = llm.invoke(analysis_prompt)
    
    # Clean up the response - remove markdown code blocks if present
    content = response.content.strip()
    
    # Remove ```json and ``` markers
    content = re.sub(r'^```json\s*', '', content)
    content = re.sub(r'^```\s*', '', content)
    content = re.sub(r'\s*```$', '', content)
    content = content.strip()
    
    print(f"Cleaned content preview: {content[:200]}")
    
    return content
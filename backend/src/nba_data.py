from nba_api.stats.static import players
from nba_api.stats.endpoints import playercareerstats
from nba_api.stats.static import teams
from nba_api.stats.endpoints import leaguedashteamstats
from nba_api.stats.endpoints import leaguestandingsv3
from nba_api.stats.endpoints import teamdashboardbygeneralsplits
from nba_api.stats.endpoints import leagueleaders
from nba_api.stats.endpoints import playergamelog
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from nbainjuries import injury
from datetime import datetime
from langchain.tools import tool
import pandas as pd
import time
import requests
import os
from bs4 import BeautifulSoup

# function for getting player stats
def getPlayerStats(player_name):
    """
    Docstring for getPlayerStats
    
    :param player_name: A string of the player's name ex. "LeBron James", "Stephen Curry" ...
    """
    if not player_name:
        return "Player could not be found"
    player = players.find_players_by_full_name(player_name)
    if not player:
        return "Player could not be found"
    player_id = player[0]['id']
    career = playercareerstats.PlayerCareerStats(player_id=player_id)
    df = career.get_data_frames()[0]
    print("Using Player Stats")
    current_season_df = df[df['SEASON_ID'] == '2025-26']
    return current_season_df.to_string()
    

def getLastTenGames(player_name):
    """
    Docstring for getLastTenGames
    
    :param player_name: A string of the players name ex. "LeBron James"
    """
    if not player_name:
        return "Player could not be found"
    player = players.find_players_by_full_name(player_name)
    if not player:
        return "Player could not be found"
    
    player_id = player[0]['id']
    gamelog = playergamelog.PlayerGameLog(player_id=player_id, season='2025-26')

    df = gamelog.get_data_frames()[0]

    last_10_games = df.head(10)

    return last_10_games



import requests
from llama_index.core import VectorStoreIndex, download_loader
from llama_index.readers.file import PyMuPDFReader

# Step 1: Download the PDF to your project folder
def download_nba_pdf():
    # Example URL for today
    url = "https://ak-static.cms.nba.com/referee/injury/Injury-Report_2026-01-25_12_00PM.pdf"
    headers = {'User-Agent': 'Mozilla/5.0'}
    response = requests.get(url, headers=headers)
    
    with open("nba_injuries.pdf", "wb") as f:
        f.write(response.content)

# Step 2: Let LlamaIndex read it
def create_injury_agent():
    loader = PyMuPDFReader()
    documents = loader.load_data(file_path="nba_injuries.pdf")
    
    # Create the index
    index = VectorStoreIndex.from_documents(documents)
    
    # Create the Query Engine
    query_engine = index.as_query_engine()
    return query_engine

def getInjuryReport(team_name):
    download_nba_pdf()
    engine = create_injury_agent()
    response = engine.query(
    f"Search the document for the section titled '{team_name}'. "
    f"ONLY extract players listed directly under the '{team_name}' header. "
    "If a player is listed under a different team (like the Magic or Heat), ignore them. "
    "Return the results as a bulleted list with Player Name, Status, and Reason."
    )
    return response


def getLastMatchup(player_name,team_abbr):
    """
    Finds the last game stats for a specific player against a specific opponent.
    Args:
        player_name: The full name of the NBA player.
        team_abbr: The 3-letter abbreviation of the opponent team (e.g., 'DEN', 'LAL').
    """
    # 1. Get Player ID (Example: Jayson Tatum)
    player = players.find_players_by_full_name(player_name)[0]
    player_id = player['id']

    # 2. Fetch game log for the current season
    # '2024-25' for current, or '2023-24' for historical
    gamelog = playergamelog.PlayerGameLog(player_id=player_id, season='2025-26')
    df = gamelog.get_data_frames()[0]

    # 3. Filter for a specific opponent (Example: Miami Heat 'MIA')
    # Note: MATCHUP strings look like "BOS vs. MIA" or "BOS @ MIA"
    vs_team_df = df[df['MATCHUP'].str.contains(team_abbr)]
    if vs_team_df.empty:
        return "No games played against this team yet"
    
    return vs_team_df


# function for getting individual team stats
def getTeamStats(team_name): 
    # 1. Find the team
    team_search = teams.find_teams_by_full_name(team_name)
    if not team_search:
        return "Team could not be found"
    
    team_id = team_search[0]['id']
    season = '2025-26'

    # 2. Fetch Performance Stats (PPG, FG%, etc.)
    stats_call = teamdashboardbygeneralsplits.TeamDashboardByGeneralSplits(
        team_id=team_id,
        per_mode_detailed='PerGame',
        season=season
    )
    performance_df = stats_call.get_data_frames()[0]
    perf_row = performance_df.iloc[0]

    # 3. Fetch Standings (Record, Rank)
    standings_call = leaguestandingsv3.LeagueStandingsV3(season=season)
    standings_df = standings_call.get_data_frames()[0]
    
    # Filter the standings table for our specific team
    team_standings = standings_df[standings_df['TeamID'] == team_id].iloc[0]

    print("Get Team Stats called")
    # 4. Combine and Return
    return {
        "Team": team_search[0]['full_name'],
        "Record": f"{team_standings['WINS']}-{team_standings['LOSSES']}",
        "Win_PCT": team_standings['WinPCT'],
        "Conference": team_standings['Conference'],
        "Rank": f"{team_standings['PlayoffRank']} in {team_standings['Conference']}",
        "GP": perf_row['GP'],
        "PPG": perf_row['PTS'],
        "OPP_PPG": round(perf_row['PTS'] - perf_row['PLUS_MINUS'], 1),
        "FG_PCT": perf_row['FG_PCT'],
        "PLUS_MINUS": perf_row['PLUS_MINUS']
    }

def get_live_standings():
    # 1. Fetch official standings
    standings = leaguestandingsv3.LeagueStandingsV3(season='2025-26').get_data_frames()[0]
    
    time.sleep(1)
    # 2. Fetch team performance stats
    stats = leaguedashteamstats.LeagueDashTeamStats(season='2025-26').get_data_frames()[0]

    # --- DEBUGGING TIP ---
    # If it fails again, uncomment the line below to see all valid column names:
    # print(stats.columns.tolist()) 

    # 3. Clean Standings
    standings_clean = standings[['TeamID', 'TeamName', 'Conference', 'PlayoffRank', 'WINS', 'LOSSES']]
    
    # 4. Clean Stats (REMOVED 'OPP_PTS' from the selection list)
    stats_clean = stats[['TEAM_ID', 'GP', 'PTS', 'FG_PCT', 'FG3_PCT', 'PLUS_MINUS']].copy()
    
    # 5. Calculate Opponent PPG manually
    stats_clean['OPP_PTS'] = stats_clean['PTS'] - stats_clean['PLUS_MINUS']
    
    # 6. Merge
    final_df = pd.merge(standings_clean, stats_clean, left_on='TeamID', right_on='TEAM_ID')
    
    # Sort and convert to Markdown for your React table
    final_df = pd.merge(standings_clean, stats_clean, left_on='TeamID', right_on='TEAM_ID')
    
    # 7. Split into two DataFrames based on Conference
    east_df = final_df[final_df['Conference'] == 'East'].sort_values('PlayoffRank')
    west_df = final_df[final_df['Conference'] == 'West'].sort_values('PlayoffRank')

    final_east_df = east_df.drop(columns=['TeamID','TEAM_ID'])
    final_west_df = west_df.drop(columns=['TeamID','TEAM_ID'])
    # 8. Return them as separate keys in the same JSON object
    return {
        "east": "### 🏀 Eastern Conference\n" + final_east_df.to_markdown(index=False),
        "west": "### 🏀 Western Conference\n" + final_west_df.to_markdown(index=False)
    }

def get_stat_leaders():
    # 1. Fetch all leaders in one go (sorted by PTS by default)
    # per_mode48='PerGame' is key to getting PPG/APG instead of totals
    leaders = leagueleaders.LeagueLeaders(
        per_mode48='PerGame', 
        season='2025-26'
    ).get_data_frames()[0]

    # 2. Use Pandas logic to create sub-lists without re-calling the API
    # We take the top 10 for each category from the same 'leaders' DataFrame
    categories = {
        "pts": leaders.sort_values('PTS', ascending=False).head(10)[['PLAYER', 'TEAM', 'PTS']],
        "ast": leaders.sort_values('AST', ascending=False).head(10)[['PLAYER', 'TEAM', 'AST']],
        "reb": leaders.sort_values('REB', ascending=False).head(10)[['PLAYER', 'TEAM', 'REB']],
        "stl": leaders.sort_values('STL', ascending=False).head(10)[['PLAYER', 'TEAM', 'STL']],
        "blk": leaders.sort_values('BLK', ascending=False).head(10)[['PLAYER', 'TEAM', 'BLK']]
    }

    # 3. Convert them to a format your React frontend can easily map over
    return {cat: df.to_dict(orient='records') for cat, df in categories.items()}

@tool
def get_player_stats_on_date(player_name, game_date,season):
    """
    Fetches NBA player stats for a specific date.
    player_name: Full name of the player.
    game_date: The date of the game in YYYY-MM-DD format. 
    season: The season the game took place in. Format in the formate of YYYY-YY; example 2025-26
    """
    # 1. Get Player ID from name
    nba_players = players.find_players_by_full_name(player_name)
    if not nba_players:
        return f"Player '{player_name}' not found."
    
    player_id = nba_players[0]['id']
    
    # 2. Fetch the game log for the current season
    # Note: You may need to adjust the 'season' parameter dynamically 
    log = playergamelog.PlayerGameLog(player_id=player_id, season=season)
    df = log.get_data_frames()[0]
    
    # 3. Filter the results for the specific date
    # The API date format in the dataframe is usually 'MMM DD, YYYY' (e.g. 'DEC 25, 2023')
    # For a simple match, we convert our input to a datetime object
    df['GAME_DATE'] = pd.to_datetime(df['GAME_DATE'])
    print(game_date)
    target_date = pd.to_datetime(game_date)
    
    stats = df[df['GAME_DATE'] == target_date]
    
    if stats.empty:
        return f"No game found for {player_name} on {game_date}."
    
    return stats.to_dict(orient='records')[0]
import time
import pandas as pd
import requests
from datetime import datetime, timedelta
from nba_api.stats.static import players, teams
from nba_api.stats.endpoints import (
    playercareerstats, 
    leaguedashteamstats, 
    leaguestandingsv3, 
    teamdashboardbygeneralsplits, 
    leagueleaders, 
    playergamelog
)
from requests.exceptions import ReadTimeout
from llama_index.core import VectorStoreIndex
from llama_index.readers.file import PyMuPDFReader
from langchain.tools import tool

# Browser-like headers to prevent being blocked by the NBA API
CUSTOM_HEADERS = {
    'Host': 'stats.nba.com',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.5',
    'Referer': 'https://www.nba.com/',
    'Connection': 'keep-alive',
}

# Helper function to handle NBA API requests with retries and specific timeouts
def fetch_nba_data(endpoint_class, **kwargs):
    for attempt in range(3):
        try:
            # Using 60 second timeout and custom headers for stability on Hugging Face
            return endpoint_class(**kwargs, headers=CUSTOM_HEADERS, timeout=60).get_data_frames()[0]
        except ReadTimeout:
            print(f"NBA API Timeout on attempt {attempt + 1}. Retrying...")
            time.sleep(2)
    return None

# function for getting player stats
def getPlayerStats(player_name):
    """
    Docstring for getPlayerStats
    :param player_name: A string of the player's name ex. "LeBron James"
    """
    if not player_name:
        return "Player could not be found"
    player = players.find_players_by_full_name(player_name)
    if not player:
        return "Player could not be found"
    
    player_id = player[0]['id']
    df = fetch_nba_data(playercareerstats.PlayerCareerStats, player_id=player_id)
    
    if df is None:
        return "Stats currently unavailable due to API timeout."
        
    current_season_df = df[df['SEASON_ID'] == '2025-26']
    return current_season_df.to_string()
    
# function to get the last 10 games stats for a player
def getLastTenGames(player_name):
    """
    Docstring for getLastTenGames
    :param player_name: A string of the players name
    """
    if not player_name:
        return "Player could not be found"
    player = players.find_players_by_full_name(player_name)
    if not player:
        return "Player could not be found"
    
    player_id = player[0]['id']
    df = fetch_nba_data(playergamelog.PlayerGameLog, player_id=player_id, season='2025-26')

    if df is None:
        return None

    return df.head(10)

# helper function for the injury report function
def download_nba_pdf():
    # Use CUSTOM_HEADERS for consistency
    for days_back in range(7):
        target_date = datetime.now() - timedelta(days=days_back)
        date_str = target_date.strftime('%Y-%m-%d')
        times = ['12_00PM', '05_30PM', '11_30AM']
        
        for time_str in times:
            url = f"https://ak-static.cms.nba.com/referee/injury/Injury-Report_{date_str}_{time_str}.pdf"
            try:
                response = requests.get(url, headers=CUSTOM_HEADERS, timeout=15)
                if response.status_code == 200:
                    with open("nba_injuries.pdf", "wb") as f:
                        f.write(response.content)
                    return True
            except requests.RequestException:
                continue
    return False

# injury report helper function
def create_injury_agent():
    loader = PyMuPDFReader()
    documents = loader.load_data(file_path="nba_injuries.pdf")
    index = VectorStoreIndex.from_documents(documents)
    return index.as_query_engine()

# gets the injury report of a certain team
def getInjuryReport(team_name):
    if download_nba_pdf():
        engine = create_injury_agent()
        response = engine.query(
            f"Search the document for the section titled '{team_name}'. "
            f"ONLY extract players listed directly under the '{team_name}' header. "
            "Return the results as a bulleted list with Player Name, Status, and Reason."
        )
        return response
    return "Could not download injury report."

# returns stats against a certain team
def getLastMatchup(player_name, team_abbr):
    player_search = players.find_players_by_full_name(player_name)
    if not player_search:
        return "Player not found"
    
    player_id = player_search[0]['id']
    df = fetch_nba_data(playergamelog.PlayerGameLog, player_id=player_id, season='2025-26')

    if df is None:
        return "Data unavailable"

    vs_team_df = df[df['MATCHUP'].str.contains(team_abbr)]
    return vs_team_df if not vs_team_df.empty else "No games played against this team yet"

# function for getting individual team stats
def getTeamStats(team_name): 
    team_search = teams.find_teams_by_full_name(team_name)
    if not team_search:
        return "Team could not be found"
    
    team_id = team_search[0]['id']
    season = '2025-26'

    performance_df = fetch_nba_data(teamdashboardbygeneralsplits.TeamDashboardByGeneralSplits, 
                                    team_id=team_id, per_mode_detailed='PerGame', season=season)
    
    standings_df = fetch_nba_data(leaguestandingsv3.LeagueStandingsV3, season=season)

    if performance_df is None or standings_df is None:
        return "Team data currently unavailable"

    perf_row = performance_df.iloc[0]
    team_standings = standings_df[standings_df['TeamID'] == team_id].iloc[0]

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

# function for the standings tab
def get_live_standings():
    # 1. Fetch official standings
    standings = fetch_nba_data(leaguestandingsv3.LeagueStandingsV3, season='2025-26')
    time.sleep(2.5)
    # 2. Fetch team performance stats
    stats = fetch_nba_data(leaguedashteamstats.LeagueDashTeamStats, season='2025-26')

    if standings is None or stats is None:
        return {
            "east": "### 🏀 Eastern Conference\n*Data temporarily unavailable.*",
            "west": "### 🏀 Western Conference\n*Data temporarily unavailable.*"
        }

    standings_clean = standings[['TeamID', 'TeamName', 'Conference', 'PlayoffRank', 'WINS', 'LOSSES']]
    stats_clean = stats[['TEAM_ID', 'GP', 'PTS', 'FG_PCT', 'FG3_PCT', 'PLUS_MINUS']].copy()
    stats_clean['OPP_PTS'] = stats_clean['PTS'] - stats_clean['PLUS_MINUS']
    
    final_df = pd.merge(standings_clean, stats_clean, left_on='TeamID', right_on='TEAM_ID')
    east_df = final_df[final_df['Conference'] == 'East'].sort_values('PlayoffRank')
    west_df = final_df[final_df['Conference'] == 'West'].sort_values('PlayoffRank')

    final_east_df = east_df.drop(columns=['TeamID','TEAM_ID'])
    final_west_df = west_df.drop(columns=['TeamID','TEAM_ID'])
 
    return {
        "east": "### 🏀 Eastern Conference\n" + final_east_df.to_markdown(index=False),
        "west": "### 🏀 Western Conference\n" + final_west_df.to_markdown(index=False)
    }

# function for the stat leaders tab
def get_stat_leaders():
    leaders = fetch_nba_data(leagueleaders.LeagueLeaders, per_mode48='PerGame', season='2025-26')

    if leaders is None:
        return {"pts": [], "ast": [], "reb": [], "stl": [], "blk": []}

    categories = {
        "pts": leaders.sort_values('PTS', ascending=False).head(10)[['PLAYER', 'TEAM', 'PTS']],
        "ast": leaders.sort_values('AST', ascending=False).head(10)[['PLAYER', 'TEAM', 'AST']],
        "reb": leaders.sort_values('REB', ascending=False).head(10)[['PLAYER', 'TEAM', 'REB']],
        "stl": leaders.sort_values('STL', ascending=False).head(10)[['PLAYER', 'TEAM', 'STL']],
        "blk": leaders.sort_values('BLK', ascending=False).head(10)[['PLAYER', 'TEAM', 'BLK']]
    }
    return {cat: df.to_dict(orient='records') for cat, df in categories.items()}

# chatbot tool for date-specific queries
@tool
def get_player_stats_on_date(player_name, game_date, season):
    """
    Fetches NBA player stats for a specific date.
    player_name: Full name of the player.
    game_date: YYYY-MM-DD format. 
    season: YYYY-YY; example 2025-26
    """
    nba_players = players.find_players_by_full_name(player_name)
    if not nba_players:
        return f"Player '{player_name}' not found."
    
    player_id = nba_players[0]['id']
    df = fetch_nba_data(playergamelog.PlayerGameLog, player_id=player_id, season=season)
    
    if df is None:
        return "Data unavailable due to API timeout."
    
    df['GAME_DATE'] = pd.to_datetime(df['GAME_DATE'])
    target_date = pd.to_datetime(game_date)
    stats = df[df['GAME_DATE'] == target_date]
    
    if stats.empty:
        return f"No game found for {player_name} on {game_date}."
    
    return stats.to_dict(orient='records')[0]
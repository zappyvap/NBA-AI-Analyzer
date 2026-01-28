from nba_api.stats.static import players
from nba_api.stats.endpoints import playercareerstats
from nba_api.stats.static import teams
from nba_api.stats.endpoints import leaguedashteamstats
from nba_api.stats.endpoints import leaguestandingsv3
from nba_api.stats.endpoints import teamdashboardbygeneralsplits
from nba_api.stats.endpoints import leagueleaders
from nba_api.stats.endpoints import playergamelog
from datetime import datetime, timedelta
from langchain.tools import tool
import pandas as pd
import time
import requests


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
    
# function to get the last 10 games stats for a player
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

# helper function for the injury report function, this just gets the injury report pdf from the nba website
def download_nba_pdf():
    headers = {'User-Agent': 'Mozilla/5.0'}
    
    for days_back in range(7):
        target_date = datetime.now() - timedelta(days=days_back)
        date_str = target_date.strftime('%Y-%m-%d')
        
        
        times = ['12_00PM', '05_30PM', '11_30AM']
        
        for time_str in times:
            url = f"https://ak-static.cms.nba.com/referee/injury/Injury-Report_{date_str}_{time_str}.pdf"
            
            try:
                response = requests.get(url, headers=headers, timeout=10)
                
                if response.status_code == 200:
                    with open("nba_injuries.pdf", "wb") as f:
                        f.write(response.content)
                    print(f"Downloaded: {date_str} {time_str}")
                    return True
            except requests.RequestException:
                continue

# this is another injury report helper function, it gets the pdf using the other function and makes a llamaindex agent for it.
def create_injury_agent():
    loader = PyMuPDFReader()
    documents = loader.load_data(file_path="nba_injuries.pdf")
    
    index = VectorStoreIndex.from_documents(documents)
    
    query_engine = index.as_query_engine()
    return query_engine

# this function gets the injury report of a certain team
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

# returns the stats of a player the last time they played a certain team
def getLastMatchup(player_name,team_abbr):
    """
    Finds the last game stats for a specific player against a specific opponent.
    Args:
        player_name: The full name of the NBA player.
        team_abbr: The 3-letter abbreviation of the opponent team (e.g., 'DEN', 'LAL').
    """

    player = players.find_players_by_full_name(player_name)[0]
    player_id = player['id']

    gamelog = playergamelog.PlayerGameLog(player_id=player_id, season='2025-26')
    df = gamelog.get_data_frames()[0]

    vs_team_df = df[df['MATCHUP'].str.contains(team_abbr)]
    if vs_team_df.empty:
        return "No games played against this team yet"
    
    return vs_team_df


# function for getting individual team stats
def getTeamStats(team_name): 

    team_search = teams.find_teams_by_full_name(team_name)
    if not team_search:
        return "Team could not be found"
    
    team_id = team_search[0]['id']
    season = '2025-26'

    
    stats_call = teamdashboardbygeneralsplits.TeamDashboardByGeneralSplits(
        team_id=team_id,
        per_mode_detailed='PerGame',
        season=season
    )
    performance_df = stats_call.get_data_frames()[0]
    perf_row = performance_df.iloc[0]


    standings_call = leaguestandingsv3.LeagueStandingsV3(season=season)
    standings_df = standings_call.get_data_frames()[0]
    
  
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

# this is the function that makes the standing tab work, just fetches the standings from the api
def get_live_standings():
    # 1. Fetch official standings
    standings = leaguestandingsv3.LeagueStandingsV3(season='2025-26').get_data_frames()[0]
    
    time.sleep(1)
    # 2. Fetch team performance stats
    stats = leaguedashteamstats.LeagueDashTeamStats(season='2025-26').get_data_frames()[0]


    standings_clean = standings[['TeamID', 'TeamName', 'Conference', 'PlayoffRank', 'WINS', 'LOSSES']]
  
    stats_clean = stats[['TEAM_ID', 'GP', 'PTS', 'FG_PCT', 'FG3_PCT', 'PLUS_MINUS']].copy()
    
    stats_clean['OPP_PTS'] = stats_clean['PTS'] - stats_clean['PLUS_MINUS']
    

    final_df = pd.merge(standings_clean, stats_clean, left_on='TeamID', right_on='TEAM_ID')
    
 
    final_df = pd.merge(standings_clean, stats_clean, left_on='TeamID', right_on='TEAM_ID')

    east_df = final_df[final_df['Conference'] == 'East'].sort_values('PlayoffRank')
    west_df = final_df[final_df['Conference'] == 'West'].sort_values('PlayoffRank')

    final_east_df = east_df.drop(columns=['TeamID','TEAM_ID'])
    final_west_df = west_df.drop(columns=['TeamID','TEAM_ID'])
 
    return {
        "east": "### 🏀 Eastern Conference\n" + final_east_df.to_markdown(index=False),
        "west": "### 🏀 Western Conference\n" + final_west_df.to_markdown(index=False)
    }

# this function is the function that sets up the stat leaders tab
def get_stat_leaders():
  
    leaders = leagueleaders.LeagueLeaders(
        per_mode48='PerGame', 
        season='2025-26'
    ).get_data_frames()[0]

    categories = {
        "pts": leaders.sort_values('PTS', ascending=False).head(10)[['PLAYER', 'TEAM', 'PTS']],
        "ast": leaders.sort_values('AST', ascending=False).head(10)[['PLAYER', 'TEAM', 'AST']],
        "reb": leaders.sort_values('REB', ascending=False).head(10)[['PLAYER', 'TEAM', 'REB']],
        "stl": leaders.sort_values('STL', ascending=False).head(10)[['PLAYER', 'TEAM', 'STL']],
        "blk": leaders.sort_values('BLK', ascending=False).head(10)[['PLAYER', 'TEAM', 'BLK']]
    }

 
    return {cat: df.to_dict(orient='records') for cat, df in categories.items()}

# a specific function for the chatbot that helps with users asking about 'yesterdays game' or a game on 'May 14th 2021'
@tool
def get_player_stats_on_date(player_name, game_date,season):
    """
    Fetches NBA player stats for a specific date.
    player_name: Full name of the player.
    game_date: The date of the game in YYYY-MM-DD format. 
    season: The season the game took place in. Format in the formate of YYYY-YY; example 2025-26
    """
    
    nba_players = players.find_players_by_full_name(player_name)
    if not nba_players:
        return f"Player '{player_name}' not found."
    
    player_id = nba_players[0]['id']
    
  
    log = playergamelog.PlayerGameLog(player_id=player_id, season=season)
    df = log.get_data_frames()[0]
    
    df['GAME_DATE'] = pd.to_datetime(df['GAME_DATE'])
    print(game_date)
    target_date = pd.to_datetime(game_date)
    
    stats = df[df['GAME_DATE'] == target_date]
    
    if stats.empty:
        return f"No game found for {player_name} on {game_date}."
    
    return stats.to_dict(orient='records')[0]
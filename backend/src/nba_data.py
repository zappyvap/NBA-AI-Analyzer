from nba_api.stats.static import players
from nba_api.stats.endpoints import playercareerstats
from nba_api.stats.static import teams
from nba_api.stats.endpoints import leaguedashteamstats
from nba_api.stats.endpoints import leaguestandingsv3
from nba_api.stats.endpoints import teamdashboardbygeneralsplits
import pandas as pd
import time

# function for getting player stats
def getPlayerStats(player_name): 
    if not player_name:
        return "Player could not be found"
    player = players.find_players_by_full_name(player_name)
    if not player:
        return "Player could not be found"
    player_id = player[0]['id']
    career = playercareerstats.PlayerCareerStats(player_id=player_id)
    df = career.get_data_frames()[0]

    return df.to_string() #easier for ai to read

# function for getting individual team stats
def getTeamStats(team_name): 
    # 1. Find the team
    if not team_name:
        return "Team name is required"
    
    team_search = teams.find_teams_by_full_name(team_name)
    if not team_search:
        return "Team could not be found"
    
    team_id = team_search[0]['id']

    # 2. Fetch the stats for the team
    # 'Overall' is the specific dashboard that contains season-long averages
    stats_call = teamdashboardbygeneralsplits.TeamDashboardByGeneralSplits(
        team_id=team_id,
        per_mode_detailed='PerGame',
        season='2025-26'
    )
    
    # 3. Get the "Overall" data frame
    # This endpoint returns multiple tables; index [0] is the main season stats
    df = stats_call.get_data_frames()[0]

    # 4. Extract and return the specific stats you wanted
    # We return it as a dictionary for easy use in a web app
    stats_row = df.iloc[0] # There is only one row in the Overall table
    
    return {
        "Team": team_search[0]['full_name'],
        "GP": stats_row['GP'],
        "PPG": stats_row['PTS'],
        "OPP_PPG": stats_row['OPP_PTS'],
        "FG_PCT": stats_row['FG_PCT'],
        "FG3_PCT": stats_row['FG3_PCT'],
        "PLUS_MINUS": stats_row['PLUS_MINUS']
    }

def get_live_standings():
    # 1. Fetch official standings (Seeding, W-L, L10)
    standings = leaguestandingsv3.LeagueStandingsV3(season='2025-26').get_data_frames()[0]
    
    # 2. Fetch team performance stats (PPG, FG%, etc.)
    # We add a small sleep to avoid rate limiting
    time.sleep(1)
    stats = leaguedashteamstats.LeagueDashTeamStats(season='2025-26').get_data_frames()[0]
    
    # 3. Merge them on TeamID
    # We select only the columns we need for a clean display
    standings_clean = standings[['TeamID', 'TeamName', 'Conference', 'PlayoffRank', 'WINS', 'LOSSES', 'WinPCT']]
    stats_clean = stats[['GP', 'PTS', 'OPP_PTS', 'FG_PCT', 'FG3_PCT', 'PLUS_MINUS']]
    
    final_df = pd.merge(standings_clean, stats_clean, left_on='TeamID', right_on='TEAM_ID')
    
    # Sort by Conference and Rank
    return final_df.sort_values(['Conference', 'PlayoffRank'])
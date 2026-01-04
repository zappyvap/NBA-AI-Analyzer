from nba_api.stats.static import players
from nba_api.stats.endpoints import playercareerstats

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


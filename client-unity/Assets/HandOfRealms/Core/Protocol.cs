// Messages échangés avec le serveur de jeu (src/server/*.ts). Aucune dépendance à Unity.
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace HandOfRealms.Core
{
    public class CardDto
    {
        [JsonProperty("name")] public string Name;
        [JsonProperty("type")] public string Type;
        [JsonProperty("pantheon")] public string Pantheon;
        [JsonProperty("rarity")] public string Rarity;
        [JsonProperty("mana")] public int? Mana;
        [JsonProperty("attack")] public int? Attack;
        [JsonProperty("health")] public int? Health;
        [JsonProperty("movement")] public int? Movement;
        [JsonProperty("attackRange")] public string AttackRange;
        [JsonProperty("text")] public string Text;

        public bool IsManaToken => Type == "Item" && Name == "Mana";
    }

    public class UnitView
    {
        [JsonProperty("id")] public int Id;
        [JsonProperty("name")] public string Name;
        [JsonProperty("owner")] public int Owner;
        [JsonProperty("cell")] public string Cell;
        [JsonProperty("attack")] public int Attack;
        [JsonProperty("health")] public int Health;
        [JsonProperty("maxHealth")] public int MaxHealth;
        [JsonProperty("movement")] public int Movement;
        [JsonProperty("attackRange")] public string AttackRange;
        [JsonProperty("exhausted")] public bool Exhausted;
        [JsonProperty("moved")] public bool Moved;
        [JsonProperty("attacked")] public bool Attacked;
    }

    public class PlayerPublic
    {
        [JsonProperty("crystalCell")] public string CrystalCell;
        [JsonProperty("crystalHp")] public int CrystalHp;
        [JsonProperty("mana")] public int Mana;
        [JsonProperty("maxMana")] public int MaxMana;
        [JsonProperty("handCount")] public int HandCount;
        [JsonProperty("deckCount")] public int DeckCount;
        /// <summary>Null pour l'adversaire.</summary>
        [JsonProperty("hand")] public CardDto[] Hand;
    }

    public class UnitOptions
    {
        [JsonProperty("id")] public int Id;
        [JsonProperty("move")] public string[] Move = new string[0];
        [JsonProperty("attack")] public string[] Attack = new string[0];
    }

    public class Options
    {
        [JsonProperty("deploy")] public string[] Deploy = new string[0];
        [JsonProperty("units")] public UnitOptions[] Units = new UnitOptions[0];
    }

    public class PlayerView
    {
        [JsonProperty("you")] public int You;
        [JsonProperty("active")] public int Active;
        [JsonProperty("turn")] public int Turn;
        [JsonProperty("winner")] public int? Winner;
        [JsonProperty("players")] public PlayerPublic[] Players;
        [JsonProperty("units")] public UnitView[] Units = new UnitView[0];
        /// <summary>Coups possibles calculés par le serveur ; null si ce n'est pas notre tour.</summary>
        [JsonProperty("options")] public Options Options;
        [JsonProperty("names")] public string[] Names;
        [JsonProperty("pantheons")] public string[] Pantheons;

        public bool MyTurn => Active == You && Winner == null;
        public PlayerPublic Me => Players[You];
    }

    /// <summary>Un événement du moteur (voir GameEvent dans src/engine.ts).</summary>
    public class GameEvent
    {
        readonly JObject _o;
        public GameEvent(JObject o) { _o = o; }
        public string Type => (string)_o["type"];
        public int UnitId => (int?)_o["unitId"] ?? -1;
        public int Player => (int?)_o["player"] ?? -1;
        public int Damage => (int?)_o["damage"] ?? 0;
        public int Hp => (int?)_o["hp"] ?? 0;
        public int Owner => (int?)_o["owner"] ?? -1;
        public int Winner => (int?)_o["winner"] ?? -1;
        public int TargetUnitId => (int?)_o["targetUnitId"] ?? (int?)_o["target"]?["unitId"] ?? -1;
        public string TargetKind => (string)_o["target"]?["kind"];
        public int TargetPlayer => (int?)_o["target"]?["player"] ?? -1;
        public bool Ranged => (bool?)_o["ranged"] ?? false;
        public string Cell => (string)_o["cell"];
        public string Name => (string)_o["name"];
        public string Card => (string)_o["card"];
        public string[] Path => _o["path"]?.ToObject<string[]>() ?? new string[0];
        public override string ToString() => _o.ToString(Formatting.None);
    }

    public class ServerMessage
    {
        public string Type;
        public int Seat;
        public string Room;
        public PlayerView View;
        public List<GameEvent> Events = new List<GameEvent>();
        public string Message;

        public static ServerMessage Parse(string json)
        {
            var o = JObject.Parse(json);
            var m = new ServerMessage { Type = (string)o["type"] };
            m.Seat = (int?)o["seat"] ?? -1;
            m.Room = (string)o["room"];
            m.Message = (string)o["message"];
            if (o["view"] is JObject v) m.View = v.ToObject<PlayerView>();
            if (o["events"] is JArray evs) m.Events = evs.OfType<JObject>().Select(e => new GameEvent(e)).ToList();
            return m;
        }
    }

    public static class ClientMessages
    {
        static string Action(object action) => JsonConvert.SerializeObject(new { type = "action", action });
        public static string Join(string room, string name, string pantheon) =>
            JsonConvert.SerializeObject(new { type = "join", room, name, pantheon });
        public static string EndTurn() => Action(new { type = "endTurn" });
        public static string Play(int handIndex, string cell) =>
            cell == null ? Action(new { type = "play", handIndex }) : Action(new { type = "play", handIndex, cell });
        public static string Move(int unitId, string cell) => Action(new { type = "move", unitId, cell });
        public static string Attack(int unitId, string cell) => Action(new { type = "attack", unitId, cell });
    }

    public static class Cells
    {
        public const int Rows = 5, Cols = 8;
        const string Letters = "ABCDE";
        public static (int row, int col) Parse(string id) => (Letters.IndexOf(id[0]), int.Parse(id.Substring(1)) - 1);
        public static string Format(int row, int col) => $"{Letters[row]}{col + 1}";
        public static IEnumerable<string> All()
        {
            for (var r = 0; r < Rows; r++)
                for (var c = 0; c < Cols; c++)
                    yield return Format(r, c);
        }
    }
}

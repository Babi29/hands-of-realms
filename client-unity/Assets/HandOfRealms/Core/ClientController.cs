// Gestion des clics du joueur. Les coups possibles viennent du serveur (PlayerView.Options).
using System.Linq;

namespace HandOfRealms.Core
{
    public class Selection
    {
        public int HandIndex = -1;
        public int UnitId = -1;
        public bool IsHand => HandIndex >= 0;
        public bool IsUnit => UnitId >= 0;
    }

    public class Highlights
    {
        public string[] Deploy = new string[0];
        public string[] Move = new string[0];
        public string[] Attack = new string[0];
    }

    public class ClientController
    {
        public PlayerView View { get; private set; }
        public Selection Selection { get; private set; }
        public string Error { get; private set; }

        public void SetView(PlayerView v)
        {
            View = v;
            Error = null;
            if (Selection == null) return;
            if (!v.MyTurn) { Selection = null; return; }
            if (Selection.IsUnit && UnitOpts(Selection.UnitId) == null) Selection = null;
            if (Selection != null && Selection.IsHand && Selection.HandIndex >= (v.Me.Hand?.Length ?? 0)) Selection = null;
        }

        UnitOptions UnitOpts(int id) => View?.Options?.Units.FirstOrDefault(u => u.Id == id);

        public Highlights Highlights()
        {
            var h = new Highlights();
            if (View == null || !View.MyTurn || Selection == null) return h;
            if (Selection.IsHand) h.Deploy = View.Options.Deploy;
            var o = Selection.IsUnit ? UnitOpts(Selection.UnitId) : null;
            if (o != null) { h.Move = o.Move; h.Attack = o.Attack; }
            return h;
        }

        /// <summary>Renvoie le message à envoyer au serveur, ou null.</summary>
        public string ClickHand(int index)
        {
            Error = null;
            if (View == null || !View.MyTurn) return null;
            var hand = View.Me.Hand;
            if (hand == null || index < 0 || index >= hand.Length) { Selection = null; return null; }
            var card = hand[index];
            if (card.IsManaToken) { Selection = null; return ClientMessages.Play(index, null); }
            if ((card.Mana ?? 0) > View.Me.Mana)
            {
                Selection = null;
                Error = $"Pas assez de mana ({View.Me.Mana}/{card.Mana})";
                return null;
            }
            Selection = new Selection { HandIndex = index };
            return null;
        }

        public string ClickCell(string cell)
        {
            Error = null;
            if (View == null || !View.MyTurn) return null;
            var h = Highlights();
            if (Selection != null && Selection.IsHand && h.Deploy.Contains(cell))
            {
                var msg = ClientMessages.Play(Selection.HandIndex, cell);
                Selection = null;
                return msg;
            }
            if (Selection != null && Selection.IsUnit)
            {
                var id = Selection.UnitId;
                if (h.Attack.Contains(cell)) { Selection = null; return ClientMessages.Attack(id, cell); }
                if (h.Move.Contains(cell)) return ClientMessages.Move(id, cell); // reste sélectionnée
            }
            var mine = View.Units.FirstOrDefault(u => u.Cell == cell && u.Owner == View.You);
            Selection = mine != null && UnitOpts(mine.Id) != null ? new Selection { UnitId = mine.Id } : null;
            return null;
        }

        public string EndTurn()
        {
            if (View == null || !View.MyTurn) return null;
            Selection = null;
            return ClientMessages.EndTurn();
        }

        public bool HasAnyAction()
        {
            if (View == null || !View.MyTurn) return false;
            var me = View.Me;
            var canPlay = (me.Hand ?? new CardDto[0]).Any(c => (c.Mana ?? 0) <= me.Mana && (c.IsManaToken || (c.Type != "Item" && View.Options.Deploy.Length > 0)));
            return canPlay || View.Options.Units.Any(u => u.Move.Length > 0 || u.Attack.Length > 0);
        }
    }
}

// Point d'entrée : crée la scène (caméra, lumière, plateau, réseau) au lancement, sans édition de scène.
// Interface provisoire en IMGUI : formulaire de connexion, barres des joueurs, main, bouton Passer, journal.
using System.Collections.Generic;
using System.Linq;
using HandOfRealms.Core;
using UnityEngine;

namespace HandOfRealms
{
    public class GameRoot : MonoBehaviour
    {
        static readonly string[] Pantheons = { "Chinese", "Egyptian", "Greek", "Mayan", "Norse", "Roman" };

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        static void Boot()
        {
            if (FindFirstObjectByType<GameRoot>() != null) return;
            new GameObject("GameRoot").AddComponent<GameRoot>();
        }

        NetClient _net;
        BoardView _board;
        readonly ClientController _ctrl = new ClientController();
        readonly List<string> _log = new List<string>();
        string _status = "Non connecté";
        string _url = "ws://localhost:8080", _room = "test", _name = "Joueur";
        int _pantheon = 2;
        bool _joined;
        Rect _handRect, _topRect, _sideRect;

        void Awake()
        {
            var cam = Camera.main;
            if (cam == null) cam = new GameObject("Main Camera") { tag = "MainCamera" }.AddComponent<Camera>();
            cam.transform.position = new Vector3(0, 8.5f, -6.5f);
            cam.transform.rotation = Quaternion.Euler(55, 0, 0);
            cam.backgroundColor = new Color(0.08f, 0.09f, 0.12f);
            cam.clearFlags = CameraClearFlags.SolidColor;
            if (FindFirstObjectByType<Light>() == null)
            {
                var l = new GameObject("Sun").AddComponent<Light>();
                l.type = LightType.Directional;
                l.transform.rotation = Quaternion.Euler(50, -30, 0);
            }
            _board = new GameObject("Board").AddComponent<BoardView>();
            _net = gameObject.AddComponent<NetClient>();
            _net.StatusChanged += s => _status = s;
            _net.Received += OnMessage;
        }

        void OnMessage(ServerMessage m)
        {
            switch (m.Type)
            {
                case "joined": _joined = true; _status = $"Salon « {m.Room} », siège {m.Seat + 1}"; break;
                case "waiting": _status = "En attente d'un adversaire…"; break;
                case "error": Log("Erreur : " + m.Message); break;
                case "events":
                    foreach (var e in m.Events) Log(Describe(e));
                    _board.EnqueueEvents(m.Events);
                    break;
                case "state":
                    _ctrl.SetView(m.View);
                    _board.EnqueueState(m.View);
                    break;
            }
        }

        void Log(string s) { if (s == null) return; _log.Add(s); if (_log.Count > 12) _log.RemoveAt(0); }

        string Who(int p) => _ctrl.View?.Names?.ElementAtOrDefault(p) ?? $"J{p + 1}";

        string Describe(GameEvent e)
        {
            switch (e.Type)
            {
                case "turnStarted": return $"— Tour de {Who(e.Player)} —";
                case "unitDeployed": return $"{Who(e.Owner)} déploie {e.Name} en {e.Cell}";
                case "attacked": return $"Attaque : {e.Damage} dégât(s){(e.Ranged ? " (tir)" : "")}";
                case "retaliated": return $"Riposte : {e.Damage} dégât(s)";
                case "unitDied": return $"Une unité meurt en {e.Cell}";
                case "crystalDamaged": return $"Cristal de {Who(e.Player)} : {e.Hp} PV";
                case "fatigue": return $"{Who(e.Player)} subit {e.Damage} de fatigue";
                case "cardBurned": return $"{Who(e.Player)} défausse {e.Card} (main pleine)";
                case "gameWon": return $"Victoire de {Who(e.Winner)} !";
                default: return null;
            }
        }

        void Update()
        {
            if (_ctrl.View == null) return;
            _board.PaintTiles(_board.Busy ? new Highlights() : _ctrl.Highlights());
        }

        // Clic ou toucher sur le plateau. Passe par les événements IMGUI : marche avec l'ancien
        // comme avec le nouveau système d'entrée, et sur mobile.
        void HandleBoardClick()
        {
            var ev = Event.current;
            if (ev.type != EventType.MouseDown || ev.button != 0 || _ctrl.View == null || _board.Busy) return;
            var gui = ev.mousePosition;
            if (_handRect.Contains(gui) || _topRect.Contains(gui) || _sideRect.Contains(gui)) return;
            var cell = _board.CellUnderPointer(new Vector3(gui.x, Screen.height - gui.y, 0));
            if (cell == null) return;
            _net.Send(_ctrl.ClickCell(cell));
            ev.Use();
        }

        void OnGUI()
        {
            GUI.skin.label.fontSize = GUI.skin.button.fontSize = GUI.skin.textField.fontSize = 16;
            if (!_joined) { ConnectForm(); return; }
            HandleBoardClick();
            var v = _ctrl.View;
            _topRect = new Rect(0, 0, Screen.width, 40);
            GUILayout.BeginArea(_topRect, GUI.skin.box);
            GUILayout.BeginHorizontal();
            if (v == null) GUILayout.Label(_status);
            else for (int p = 0; p < 2; p++)
            {
                var pl = v.Players[p];
                var mark = v.Active == p && v.Winner == null ? "▶ " : "";
                GUILayout.Label($"{mark}{Who(p)}{(p == v.You ? " (vous)" : "")} · cristal {pl.CrystalHp} · mana {pl.Mana}/{pl.MaxMana} · main {pl.HandCount} · deck {pl.DeckCount}");
                GUILayout.FlexibleSpace();
            }
            GUILayout.EndHorizontal();
            GUILayout.EndArea();

            _sideRect = new Rect(Screen.width - 330, 50, 320, 320);
            GUILayout.BeginArea(_sideRect, GUI.skin.box);
            GUILayout.Label(_status);
            if (_ctrl.Error != null) GUILayout.Label("<color=#ff8080>" + _ctrl.Error + "</color>");
            foreach (var l in _log) GUILayout.Label(l);
            GUILayout.EndArea();

            _handRect = new Rect(0, Screen.height - 110, Screen.width, 110);
            if (v == null) return;
            GUILayout.BeginArea(_handRect, GUI.skin.box);
            GUILayout.BeginHorizontal();
            var hand = v.Me.Hand ?? new CardDto[0];
            for (int i = 0; i < hand.Length; i++)
            {
                var c = hand[i];
                var sel = _ctrl.Selection != null && _ctrl.Selection.HandIndex == i;
                var label = c.IsManaToken ? "Mana\n0 · +1 mana" : $"{c.Name}\n{c.Mana} mana · {c.Attack}/{c.Health}";
                GUI.color = sel ? Color.yellow : (c.Mana ?? 0) <= v.Me.Mana ? Color.white : Color.gray;
                if (GUILayout.Button(label, GUILayout.Width(150), GUILayout.Height(90))) _net.Send(_ctrl.ClickHand(i));
            }
            GUI.color = Color.white;
            GUILayout.FlexibleSpace();
            if (v.Winner != null) GUILayout.Label($"Partie terminée : victoire de {Who(v.Winner.Value)}");
            else if (v.MyTurn)
            {
                var idle = !_ctrl.HasAnyAction();
                if (idle) GUI.color = Color.Lerp(Color.white, Color.yellow, Mathf.PingPong(Time.time * 2, 1));
                if (GUILayout.Button("Passer (fin de votre tour)", GUILayout.Width(220), GUILayout.Height(90))) _net.Send(_ctrl.EndTurn());
                GUI.color = Color.white;
            }
            else GUILayout.Label($"Tour de {Who(v.Active)}…", GUILayout.Width(220));
            GUILayout.EndHorizontal();
            GUILayout.EndArea();
        }

        void ConnectForm()
        {
            GUILayout.BeginArea(new Rect(Screen.width / 2 - 200, Screen.height / 2 - 160, 400, 320), GUI.skin.box);
            GUILayout.Label("Hand of Realms — connexion");
            GUILayout.Label("Serveur"); _url = GUILayout.TextField(_url);
            GUILayout.Label("Salon"); _room = GUILayout.TextField(_room);
            GUILayout.Label("Nom"); _name = GUILayout.TextField(_name);
            _pantheon = GUILayout.SelectionGrid(_pantheon, Pantheons, 3);
            if (GUILayout.Button("Rejoindre", GUILayout.Height(36)))
                _net.Connect(_url, ClientMessages.Join(_room, _name, Pantheons[_pantheon]));
            GUILayout.Label(_status);
            GUILayout.EndArea();
        }
    }
}

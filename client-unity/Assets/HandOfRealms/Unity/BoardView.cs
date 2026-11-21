// Plateau 3D en formes simples. Anime les événements du serveur puis applique l'état reçu.
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using HandOfRealms.Core;
using UnityEngine;

namespace HandOfRealms
{
    /// <summary>Posé sur chaque objet cliquable du plateau pour retrouver sa case.</summary>
    public class CellRef : MonoBehaviour { public string Cell; }

    public class BoardView : MonoBehaviour
    {
        public const float Step = 1.1f;
        public static readonly Color P1 = new Color(0.20f, 0.45f, 0.75f);
        public static readonly Color P2 = new Color(0.75f, 0.28f, 0.20f);
        static readonly Color TileA = new Color(0.30f, 0.33f, 0.30f);
        static readonly Color TileB = new Color(0.26f, 0.29f, 0.26f);
        static readonly Color Gold = new Color(0.85f, 0.65f, 0.15f);
        static readonly Color MoveC = new Color(0.40f, 0.62f, 0.30f);
        static readonly Color AttackC = new Color(0.85f, 0.25f, 0.20f);

        readonly Dictionary<string, Renderer> _tiles = new Dictionary<string, Renderer>();
        readonly Dictionary<int, GameObject> _units = new Dictionary<int, GameObject>();
        readonly GameObject[] _crystals = new GameObject[2];
        readonly Queue<object> _queue = new Queue<object>();
        Font _font;
        public bool Busy { get; private set; }

        public static Vector3 ToWorld(string cell)
        {
            var (r, c) = Cells.Parse(cell);
            return new Vector3((c - 3.5f) * Step, 0f, (2f - r) * Step);
        }

        void Awake()
        {
            _font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            var table = GameObject.CreatePrimitive(PrimitiveType.Cube);
            table.name = "Table";
            table.transform.SetParent(transform);
            table.transform.localScale = new Vector3(Cells.Cols * Step + 1.2f, 0.4f, Cells.Rows * Step + 1.2f);
            table.transform.position = new Vector3(0, -0.25f, 0);
            table.GetComponent<Renderer>().material.color = new Color(0.22f, 0.17f, 0.12f);
            Destroy(table.GetComponent<Collider>());
            foreach (var cell in Cells.All())
            {
                var t = GameObject.CreatePrimitive(PrimitiveType.Cube);
                t.name = "Case " + cell;
                t.transform.SetParent(transform);
                t.transform.position = ToWorld(cell);
                t.transform.localScale = new Vector3(Step * 0.94f, 0.1f, Step * 0.94f);
                t.AddComponent<CellRef>().Cell = cell;
                _tiles[cell] = t.GetComponent<Renderer>();
                Label(t.transform, cell, new Vector3(-0.38f, 0.06f, 0.38f), 0.05f, new Color(1, 1, 1, 0.35f));
            }
            PaintTiles(new Highlights());
        }

        TextMesh Label(Transform parent, string text, Vector3 local, float size, Color color)
        {
            var go = new GameObject("Texte");
            go.transform.SetParent(parent, false);
            go.transform.localPosition = local;
            go.transform.rotation = Quaternion.Euler(90, 0, 0);
            var tm = go.AddComponent<TextMesh>();
            tm.font = _font;
            tm.GetComponent<MeshRenderer>().material = _font.material;
            tm.text = text;
            tm.characterSize = size;
            tm.fontSize = 48;
            tm.anchor = TextAnchor.MiddleCenter;
            tm.color = color;
            return tm;
        }

        public void PaintTiles(Highlights h)
        {
            foreach (var kv in _tiles)
            {
                var (r, c) = Cells.Parse(kv.Key);
                var col = (r + c) % 2 == 0 ? TileA : TileB;
                if (h.Deploy.Contains(kv.Key)) col = Color.Lerp(col, Gold, 0.6f);
                if (h.Move.Contains(kv.Key)) col = Color.Lerp(col, MoveC, 0.7f);
                if (h.Attack.Contains(kv.Key)) col = Color.Lerp(col, AttackC, 0.75f);
                kv.Value.material.color = col;
            }
        }

        // ---------- File d'animations ----------

        public void EnqueueEvents(IEnumerable<GameEvent> events) { foreach (var e in events) _queue.Enqueue(e); Pump(); }
        public void EnqueueState(PlayerView v) { _queue.Enqueue(v); Pump(); }

        void Pump() { if (!Busy) StartCoroutine(Run()); }

        IEnumerator Run()
        {
            Busy = true;
            while (_queue.Count > 0)
            {
                var item = _queue.Dequeue();
                if (item is GameEvent e) yield return Animate(e);
                else if (item is PlayerView v) Sync(v);
            }
            Busy = false;
        }

        IEnumerator Animate(GameEvent e)
        {
            switch (e.Type)
            {
                case "unitDeployed":
                {
                    var go = EnsureUnit(e.UnitId, e.Name, e.Owner, e.Cell);
                    var t = go.transform;
                    var full = t.localScale;
                    for (float k = 0; k < 1; k += Time.deltaTime / 0.35f) { t.localScale = full * Mathf.SmoothStep(0.05f, 1, k); yield return null; }
                    t.localScale = full;
                    break;
                }
                case "unitMoved":
                {
                    if (!_units.TryGetValue(e.UnitId, out var go)) break;
                    foreach (var cell in e.Path.Skip(1))
                    {
                        var from = go.transform.position;
                        var to = ToWorld(cell) + Vector3.up * from.y;
                        for (float k = 0; k < 1; k += Time.deltaTime / 0.18f) { go.transform.position = Vector3.Lerp(from, to, k) + Vector3.up * Mathf.Sin(k * Mathf.PI) * 0.15f; yield return null; }
                        go.transform.position = to;
                    }
                    go.GetComponent<CellRef>().Cell = e.Path.Last();
                    break;
                }
                case "attacked":
                case "retaliated":
                {
                    if (!_units.TryGetValue(e.UnitId, out var go)) break;
                    var target = e.TargetKind == "crystal" ? _crystals[e.TargetPlayer] : (_units.TryGetValue(e.TargetUnitId, out var tu) ? tu : null);
                    if (target == null) break;
                    if (e.Ranged) yield return Projectile(go.transform.position, target.transform.position);
                    else yield return Lunge(go.transform, target.transform.position);
                    yield return Flash(target, e.Damage);
                    break;
                }
                case "crystalDamaged":
                    if (_crystals[e.Player] != null) SetCrystalHp(e.Player, e.Hp);
                    break;
                case "unitDied":
                {
                    if (!_units.TryGetValue(e.UnitId, out var go)) break;
                    _units.Remove(e.UnitId);
                    var t = go.transform; var s = t.localScale;
                    for (float k = 0; k < 1; k += Time.deltaTime / 0.4f) { t.localScale = s * (1 - k); t.Rotate(0, 600 * Time.deltaTime, 0); yield return null; }
                    Destroy(go);
                    break;
                }
                case "gameWon":
                    yield return new WaitForSeconds(0.3f);
                    break;
            }
        }

        IEnumerator Lunge(Transform t, Vector3 target)
        {
            var home = t.position;
            var hit = Vector3.Lerp(home, new Vector3(target.x, home.y, target.z), 0.6f);
            for (float k = 0; k < 1; k += Time.deltaTime / 0.12f) { t.position = Vector3.Lerp(home, hit, k); yield return null; }
            for (float k = 0; k < 1; k += Time.deltaTime / 0.18f) { t.position = Vector3.Lerp(hit, home, k); yield return null; }
            t.position = home;
        }

        IEnumerator Projectile(Vector3 from, Vector3 to)
        {
            var p = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            Destroy(p.GetComponent<Collider>());
            p.transform.localScale = Vector3.one * 0.2f;
            p.GetComponent<Renderer>().material.color = Gold;
            from += Vector3.up * 0.8f; to += Vector3.up * 0.6f;
            for (float k = 0; k < 1; k += Time.deltaTime / 0.3f) { p.transform.position = Vector3.Lerp(from, to, k) + Vector3.up * Mathf.Sin(k * Mathf.PI) * 0.8f; yield return null; }
            Destroy(p);
        }

        IEnumerator Flash(GameObject target, int damage)
        {
            var popup = Label(target.transform, "-" + damage, new Vector3(0, 1.6f, 0), 0.12f, new Color(1f, 0.35f, 0.3f));
            popup.transform.rotation = Quaternion.LookRotation(popup.transform.position - Camera.main.transform.position);
            var r = target.GetComponentInChildren<Renderer>();
            var c = r.material.color;
            r.material.color = Color.white;
            var start = popup.transform.localPosition;
            for (float k = 0; k < 1; k += Time.deltaTime / 0.5f)
            {
                popup.transform.localPosition = start + Vector3.up * k * 0.6f;
                if (k > 0.25f) r.material.color = c;
                yield return null;
            }
            r.material.color = c;
            Destroy(popup.gameObject);
        }

        // ---------- Synchronisation avec l'état ----------

        GameObject EnsureUnit(int id, string name, int owner, string cell)
        {
            if (_units.TryGetValue(id, out var go)) return go;
            go = GameObject.CreatePrimitive(PrimitiveType.Capsule);
            go.name = name;
            go.transform.SetParent(transform);
            go.transform.localScale = new Vector3(0.6f, 0.45f, 0.6f);
            go.transform.position = ToWorld(cell) + Vector3.up * 0.5f;
            go.GetComponent<Renderer>().material.color = owner == 0 ? P1 : P2;
            go.AddComponent<CellRef>().Cell = cell;
            var label = Label(go.transform, name, new Vector3(0, 2.4f, 0), 0.045f, Color.white);
            label.name = "Nom";
            var stats = Label(go.transform, "", new Vector3(0, 1.7f, 0), 0.07f, Color.white);
            stats.name = "Stats";
            _units[id] = go;
            return go;
        }

        void SetCrystalHp(int player, int hp)
        {
            var tm = _crystals[player].transform.Find("PV").GetComponent<TextMesh>();
            tm.text = hp.ToString();
        }

        public void Sync(PlayerView v)
        {
            for (var p = 0; p < 2; p++)
            {
                if (_crystals[p] == null)
                {
                    var c = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
                    c.name = "Cristal J" + (p + 1);
                    c.transform.SetParent(transform);
                    c.transform.localScale = new Vector3(0.7f, 0.6f, 0.7f);
                    c.transform.position = ToWorld(v.Players[p].CrystalCell) + Vector3.up * 0.65f;
                    c.GetComponent<Renderer>().material.color = p == 0 ? P1 : P2;
                    c.AddComponent<CellRef>().Cell = v.Players[p].CrystalCell;
                    var hp = Label(c.transform, "", new Vector3(0, 1.3f, 0), 0.1f, Color.white);
                    hp.name = "PV";
                    _crystals[p] = c;
                }
                SetCrystalHp(p, v.Players[p].CrystalHp);
            }
            var alive = new HashSet<int>(v.Units.Select(u => u.Id));
            foreach (var id in _units.Keys.Where(id => !alive.Contains(id)).ToList()) { Destroy(_units[id]); _units.Remove(id); }
            foreach (var u in v.Units)
            {
                var go = EnsureUnit(u.Id, u.Name, u.Owner, u.Cell);
                go.transform.position = ToWorld(u.Cell) + Vector3.up * 0.5f;
                go.GetComponent<CellRef>().Cell = u.Cell;
                go.transform.Find("Stats").GetComponent<TextMesh>().text = $"{u.Attack}  {u.Health}{(u.AttackRange == "ranged" ? "  ➶" : "")}";
                var tired = u.Owner == v.Active && (u.Exhausted || u.Attacked);
                var baseColor = u.Owner == 0 ? P1 : P2;
                go.GetComponent<Renderer>().material.color = tired ? Color.Lerp(baseColor, Color.gray, 0.6f) : baseColor;
            }
        }

        public string CellUnderPointer(Vector3 screenPos)
        {
            var cam = Camera.main;
            if (cam == null) return null;
            return Physics.Raycast(cam.ScreenPointToRay(screenPos), out var hit, 100f)
                ? hit.collider.GetComponentInParent<CellRef>()?.Cell
                : null;
        }
    }
}

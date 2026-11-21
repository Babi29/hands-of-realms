using System.IO;
using System.Linq;
using HandOfRealms.Core;
using Newtonsoft.Json.Linq;
using Xunit;

/// <summary>Lit de vrais messages du serveur (générés par test/contract.test.ts).</summary>
public class ContractTests
{
    static string Fixture => Path.Combine(Path.GetDirectoryName(typeof(ContractTests).Assembly.Location), "fixtures", "server-session.json");

    [Fact]
    public void Tous_les_messages_du_serveur_se_lisent()
    {
        var all = JArray.Parse(File.ReadAllText(Fixture)).Select(t => ServerMessage.Parse(t.ToString())).ToList();
        Assert.True(all.Count > 5);
        var states = all.Where(m => m.Type == "state").ToList();
        Assert.All(states, s => { Assert.NotNull(s.View.Players[0].Hand); Assert.Null(s.View.Players[1].Hand); Assert.Equal("Ana", s.View.Names[0]); });
        Assert.Contains(states, s => s.View.Units.Length > 0 && s.View.Units[0].Cell.Length == 2);
        Assert.Contains(states, s => s.View.Options != null && s.View.Options.Deploy.Length > 0);
        var events = all.Where(m => m.Type == "events").SelectMany(m => m.Events).ToList();
        Assert.Contains(events, e => e.Type == "unitDeployed" && e.UnitId > 0 && e.Cell != null);
        Assert.Contains(events, e => e.Type == "turnStarted" && e.Player >= 0);
        Assert.Contains(all, m => m.Type == "error" && !string.IsNullOrEmpty(m.Message));
    }

    [Fact]
    public void Le_controleur_accepte_les_vues_reelles()
    {
        var c = new ClientController();
        foreach (var t in JArray.Parse(File.ReadAllText(Fixture)))
        {
            var m = ServerMessage.Parse(t.ToString());
            if (m.Type == "state") { c.SetView(m.View); c.HasAnyAction(); c.Highlights(); }
        }
    }
}

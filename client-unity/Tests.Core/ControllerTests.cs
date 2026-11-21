using HandOfRealms.Core;
using Xunit;

public class ControllerTests
{
    static PlayerView View(bool myTurn = true, int mana = 5) => new PlayerView
    {
        You = 0, Active = myTurn ? 0 : 1, Turn = 1,
        Players = new[]
        {
            new PlayerPublic { CrystalCell = "C2", Mana = mana, MaxMana = 5, Hand = new[]
            {
                new CardDto { Name = "Hoplite", Type = "Minion", Mana = 2, Attack = 2, Health = 3 },
                new CardDto { Name = "Titan", Type = "God", Mana = 9, Attack = 9, Health = 9 },
                new CardDto { Name = "Mana", Type = "Item", Mana = 0 },
            } },
            new PlayerPublic { CrystalCell = "C7" },
        },
        Units = new[]
        {
            new UnitView { Id = 1, Owner = 0, Cell = "C4", Name = "G" },
            new UnitView { Id = 2, Owner = 1, Cell = "C5", Name = "E" },
        },
        Options = myTurn ? new Options
        {
            Deploy = new[] { "B1", "B2" },
            Units = new[] { new UnitOptions { Id = 1, Move = new[] { "B4", "D4" }, Attack = new[] { "C5" } } },
        } : null,
    };

    [Fact]
    public void Deploie_une_carte_choisie_sur_une_case_doree()
    {
        var c = new ClientController(); c.SetView(View());
        Assert.Null(c.ClickHand(0));
        Assert.Equal(new[] { "B1", "B2" }, c.Highlights().Deploy);
        Assert.Equal(ClientMessages.Play(0, "B1"), c.ClickCell("B1"));
        Assert.Null(c.Selection);
    }

    [Fact]
    public void Joue_la_carte_Mana_immediatement()
    {
        var c = new ClientController(); c.SetView(View());
        Assert.Equal(ClientMessages.Play(2, null), c.ClickHand(2));
    }

    [Fact]
    public void Refuse_une_carte_trop_chere()
    {
        var c = new ClientController(); c.SetView(View());
        Assert.Null(c.ClickHand(1));
        Assert.Null(c.Selection);
        Assert.Contains("mana", c.Error);
    }

    [Fact]
    public void Selectionne_une_unite_puis_deplace_ou_attaque()
    {
        var c = new ClientController(); c.SetView(View());
        Assert.Null(c.ClickCell("C4"));
        Assert.Equal(new[] { "B4", "D4" }, c.Highlights().Move);
        Assert.Equal(new[] { "C5" }, c.Highlights().Attack);
        Assert.Equal(ClientMessages.Move(1, "D4"), c.ClickCell("D4"));
        Assert.Equal(1, c.Selection.UnitId); // reste sélectionnée pour attaquer ensuite
        c.ClickCell("C4");
        Assert.Equal(ClientMessages.Attack(1, "C5"), c.ClickCell("C5"));
        Assert.Null(c.Selection);
    }

    [Fact]
    public void Ignore_les_clics_hors_de_son_tour()
    {
        var c = new ClientController(); c.SetView(View(myTurn: false));
        Assert.Null(c.ClickCell("C4"));
        Assert.Null(c.ClickHand(0));
        Assert.Null(c.Selection);
        Assert.Null(c.EndTurn());
    }

    [Fact]
    public void Fin_de_tour_vide_la_selection()
    {
        var c = new ClientController(); c.SetView(View());
        c.ClickCell("C4");
        Assert.Equal(ClientMessages.EndTurn(), c.EndTurn());
        Assert.Null(c.Selection);
    }

    [Fact]
    public void Une_nouvelle_vue_annule_une_selection_devenue_invalide()
    {
        var c = new ClientController(); c.SetView(View());
        c.ClickCell("C4");
        var v = View(); v.Options.Units = new UnitOptions[0];
        c.SetView(v);
        Assert.Null(c.Selection);
    }

    [Fact]
    public void Indique_quand_plus_rien_n_est_jouable()
    {
        var c = new ClientController();
        var v = View(mana: 0); v.Options.Units = new UnitOptions[0];
        v.Players[0].Hand = new[] { new CardDto { Name = "Hoplite", Type = "Minion", Mana = 2 } };
        c.SetView(v);
        Assert.False(c.HasAnyAction());
        c.SetView(View());
        Assert.True(c.HasAnyAction());
    }
}

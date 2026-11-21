using System.Linq;
using HandOfRealms.Core;
using Xunit;

public class ProtocolTests
{
    const string StateJson = @"{""type"":""state"",""view"":{""you"":0,""active"":0,""turn"":3,""winner"":null,
      ""players"":[{""crystalCell"":""C2"",""crystalHp"":25,""mana"":2,""maxMana"":3,""handCount"":1,""deckCount"":20,
        ""hand"":[{""name"":""Hoplite"",""type"":""Minion"",""pantheon"":""Greek"",""rarity"":""Common"",""mana"":2,""attack"":2,""health"":3,""movement"":2,""attackRange"":""melee"",""text"":""""}]},
        {""crystalCell"":""C7"",""crystalHp"":21,""mana"":0,""maxMana"":2,""handCount"":5,""deckCount"":19,""hand"":null}],
      ""units"":[{""id"":4,""name"":""Archer"",""owner"":1,""cell"":""C5"",""attack"":2,""health"":2,""maxHealth"":2,""movement"":2,""attackRange"":""ranged"",""exhausted"":false,""moved"":false,""attacked"":false}],
      ""options"":{""deploy"":[""B1"",""B2""],""units"":[]},""names"":[""Ana"",""Bob""],""pantheons"":[""Greek"",""Norse""]}}";

    [Fact]
    public void Lit_un_message_d_etat()
    {
        var msg = ServerMessage.Parse(StateJson);
        Assert.Equal("state", msg.Type);
        var v = msg.View;
        Assert.Equal(3, v.Turn);
        Assert.Null(v.Winner);
        Assert.Equal("Hoplite", v.Players[0].Hand[0].Name);
        Assert.Null(v.Players[1].Hand);
        Assert.Equal(21, v.Players[1].CrystalHp);
        Assert.Equal("ranged", v.Units[0].AttackRange);
        Assert.Equal(new[] { "B1", "B2" }, v.Options.Deploy);
        Assert.Equal("Bob", v.Names[1]);
    }

    [Fact]
    public void Lit_les_evenements_et_leurs_champs()
    {
        var msg = ServerMessage.Parse(@"{""type"":""events"",""events"":[
          {""type"":""unitMoved"",""unitId"":4,""path"":[""C5"",""C6""]},
          {""type"":""attacked"",""unitId"":4,""target"":{""kind"":""crystal"",""player"":0},""damage"":3,""ranged"":true},
          {""type"":""unitDied"",""unitId"":7,""cell"":""B3""}]}");
        Assert.Equal(3, msg.Events.Count);
        Assert.Equal("unitMoved", msg.Events[0].Type);
        Assert.Equal(new[] { "C5", "C6" }, msg.Events[0].Path);
        Assert.Equal("crystal", msg.Events[1].TargetKind);
        Assert.Equal(0, msg.Events[1].TargetPlayer);
        Assert.True(msg.Events[1].Ranged);
        Assert.Equal(3, msg.Events[1].Damage);
        Assert.Equal("B3", msg.Events[2].Cell);
    }

    [Fact]
    public void Lit_une_erreur()
    {
        var msg = ServerMessage.Parse(@"{""type"":""error"",""message"":""Ce n'est pas votre tour""}");
        Assert.Equal("Ce n'est pas votre tour", msg.Message);
    }

    [Fact]
    public void Ecrit_les_messages_client()
    {
        Assert.Equal(@"{""type"":""join"",""room"":""r1"",""name"":""Ana"",""pantheon"":""Greek""}", ClientMessages.Join("r1", "Ana", "Greek"));
        Assert.Equal(@"{""type"":""action"",""action"":{""type"":""endTurn""}}", ClientMessages.EndTurn());
        Assert.Equal(@"{""type"":""action"",""action"":{""type"":""play"",""handIndex"":2,""cell"":""B1""}}", ClientMessages.Play(2, "B1"));
        Assert.Equal(@"{""type"":""action"",""action"":{""type"":""play"",""handIndex"":0}}", ClientMessages.Play(0, null));
        Assert.Equal(@"{""type"":""action"",""action"":{""type"":""move"",""unitId"":4,""cell"":""C6""}}", ClientMessages.Move(4, "C6"));
        Assert.Equal(@"{""type"":""action"",""action"":{""type"":""attack"",""unitId"":4,""cell"":""C7""}}", ClientMessages.Attack(4, "C7"));
    }

    [Fact]
    public void Convertit_les_cases()
    {
        Assert.Equal((2, 1), Cells.Parse("C2"));
        Assert.Equal("E8", Cells.Format(4, 7));
        Assert.Equal(40, Cells.All().Count());
    }
}

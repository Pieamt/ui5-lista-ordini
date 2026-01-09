sap.ui.define(
  ["./BaseController", "sap/m/MessageToast", "sap/ui/model/json/JSONModel", "listaordini/model/formatter"],
  function (BaseController, MessageToast, JSONModel, formatter) {
    "use strict";

    return BaseController.extend("listaordini.controller.Home", {
      formatter: formatter,

      onInit: function () {
        this.getRouter().getRoute("Home").attachPatternMatched(this._onObjectMatched, this);
      },

      _onObjectMatched: function () {
        // Modello mock per la ComboBox
        const oStateModel = new JSONModel({
          states: [
            { key: "01", text: "Evaso" },
            { key: "02", text: "In elaborazione" },
            { key: "03", text: "In transito" },
          ],
        });
        // Setto il modello alla view con nome 'States'
        this.setModel(oStateModel, "States");

        // Modello mock per la lista
        const oListOrder = new JSONModel({
          order: [
            {
              Id: 1,
              Nome: "Cliente 1",
              Data: new Date("2025-05-21T07:32:00"),
              Importo: "121",
              Valuta: "€",
              Stato: "In elaborazione",
            },
            {
              Id: 2,
              Nome: "Cliente 2",
              Data: new Date("2025-05-23T08:52:00"),
              Importo: "205",
              Valuta: "€",
              Stato: "In elaborazione",
            },
            {
              Id: 3,
              Nome: "Cliente 3",
              Data: new Date("2025-05-25T12:39:00"),
              Importo: "78",
              Valuta: "€",
              Stato: "In elaborazione",
            },
            {
              Id: 4,
              Nome: "Cliente 4",
              Data: new Date("2025-05-21T16:22:00"),
              Importo: "56",
              Valuta: "€",
              Stato: "In elaborazione",
            },
            {
              Id: 5,
              Nome: "Cliente 5",
              Data: new Date("2025-05-24T15:01:00"),
              Importo: "94",
              Valuta: "€",
              Stato: "In transito",
            },
            {
              Id: 6,
              Nome: "Cliente 6",
              Data: new Date("2025-05-30T09:32:00"),
              Importo: "324",
              Valuta: "€",
              Stato: "In transito",
            },
            {
              Id: 7,
              Nome: "Cliente 7",
              Data: new Date("2025-05-28T02:32:00"),
              Importo: "51",
              Valuta: "€",
              Stato: "In transito",
            },
            {
              Id: 8,
              Nome: "Cliente 8",
              Data: new Date("2025-05-26T11:32:00"),
              Importo: "98",
              Valuta: "€",
              Stato: "In transito",
            },
            {
              Id: 9,
              Nome: "Cliente 9",
              Data: new Date("2025-05-24T18:29:00"),
              Importo: "54",
              Valuta: "€",
              Stato: "Evaso",
            },
            {
              Id: 10,
              Nome: "Cliente 10",
              Data: new Date("2025-05-29T10:32:00"),
              Importo: "83",
              Valuta: "€",
              Stato: "Evaso",
            },
            {
              Id: 11,
              Nome: "Cliente 11",
              Data: new Date("2025-05-28T15:47:00"),
              Importo: "64",
              Valuta: "€",
              Stato: "Evaso",
            },
            {
              Id: 12,
              Nome: "Cliente 12",
              Data: new Date("2025-05-21T17:36:00"),
              Importo: "179",
              Valuta: "€",
              Stato: "Evaso",
            },
          ],
        });

        // Setto il modello alla view con nome 'States'
        this.setModel(oListOrder, "Orders");
      },

      onPress: function () {
        MessageToast.show("Hai premuto il pulsante!");
      },
    });
  }
);

sap.ui.define(
  ["../BaseController", "sap/ui/model/json/JSONModel", "listaordini/util/generalUtils", "listaordini/util/entityUtils"],
  function (BaseController, JSONModel, generalUtils, entityUtils) {
    "use strict";

    return BaseController.extend("listaordini.controller.ordini.Ordine", {
      onInit: function () {
        this.setModel(
          new JSONModel({
            isEdit: false,
            title: "",
          }),
          "Mode"
        );
        this.oModelTotalCost = this.setModel(new JSONModel({ costoTotale: 0 }), "CostoTotale");
        this.getRouter().getRoute("NuovoOrdine").attachPatternMatched(this._onNew, this);
        this.getRouter().getRoute("DettaglioOrdine").attachPatternMatched(this._onEdit, this);
      },

      _onNew: function () {
        const mode = this.getModel("Mode");
        mode.setProperty("/title", "Nuovo Ordine");
        mode.setProperty("/isEdit", false);
      },

      _onEdit: function () {},

      onAddItem: function () {
        if (!this._oAddDialog) {
          this._oAddDialog = sap.ui.xmlfragment("listaordini.view.ordini.fragment.AddArticoliDialog", this);
          this.getView().addDependent(this._oAddDialog);
        }

        this._loadSelectableItems();
        this._oAddDialog.open();
      },

      _loadSelectableItems: async function () {
        if (!this.oSelectItemsModel) {
          this.oSelectItemsModel = this.setModel(new JSONModel({ Data: [] }), "Articoli");
        }

        this.setBusy(true);
        try {
          const oResult = await this.getEntitySet("/ZES_articoliSet");
          this.oSelectItemsModel.setProperty("/Data", oResult.data);
        } finally {
          this.setBusy(false);
        }
      },

      onConfirmAddItems: function () {
        const oTable = sap.ui.getCore().byId(this._oAddDialog.getContent()[0].getId());
        const aSelectedIndices = oTable.getSelectedIndices();
        if (!aSelectedIndices.length) {
          return;
        }
        const aSelectableData = this.getModel("Articoli").getProperty("/Data");
        const aOrderItems = this.getModel("Ordini").getProperty("/Data");

        aSelectedIndices.forEach((iIndex) => {
          const oItem = aSelectableData[iIndex];
          const bExists = aOrderItems.some((o) => o.CodArticolo === oItem.CodArticolo);
          if (!bExists) {
            aOrderItems.push({
              CodArticolo: oItem.CodArticolo,
              NomeArticolo: oItem.NomeArticolo,
              Quantita: 1,
              ImportoTot: oItem.Importo,
            });
          }
        });

        this.getModel("Ordini").refresh(true);
        this._recalculateTotale();
        oTable.clearSelection();
        this._oAddDialog.close();
      },

      _recalculateTotale: function () {
        const aData = this.getModel("Ordini").getProperty("/Data") || [];
        const fTot = aData.reduce((sum, o) => {
          return sum + (Number(o.ImportoTot) || 0);
        }, 0);

        this.getModel("CostoTotale").setProperty("/costoTotale", fTot);
      },

      onCloseAddDialog: function () {
        this._oAddDialog.close();
      },

      onBack: function () {
        this.navTo("ListaOrdini");
      },
    });
  }
);

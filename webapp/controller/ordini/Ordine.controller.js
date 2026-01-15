sap.ui.define(
  [
    "../BaseController",
    "sap/ui/model/json/JSONModel",
    "listaordini/util/generalUtils",
    "listaordini/util/entityUtils",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
  ],
  function (BaseController, JSONModel, generalUtils, entityUtils, MessageToast, MessageBox) {
    "use strict";

    const INIT_MODEL_DEEPORDINI = {
      Operation: "",
      NumOrdine: 0,
      ZET_lista_ordini: {
        NumOrdine: 0,
        Cliente: "",
        DataOrdine: "",
        ImportoTot: 0,
        Stato: "",
        StatoTxt: "",
      },
      ZET_dettagli_ordiniSet: [],
    };

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
        this.oModelOrder = this.setModel(new JSONModel(INIT_MODEL_DEEPORDINI), "Ordine");
        this.getRouter().getRoute("NuovoOrdine").attachPatternMatched(this._onNew, this);
        this.getRouter().getRoute("DettaglioOrdine").attachPatternMatched(this._onEdit, this);
      },

      _onNew: function () {
        console.log("qui");
        const mode = this.getModel("Mode");
        mode.setProperty("/title", "Nuovo Ordine");
        mode.setProperty("/isEdit", false);
        this.oModelOrder = this.setModel(new JSONModel(generalUtils.copyWithoutRef(INIT_MODEL_DEEPORDINI)), "Ordine");
      },

      _onEdit: function () {},

      onSave: async function () {
        const sTotalCost = this.oModelTotalCost.getProperty("/costoTotale");
        this.oModelOrder.setProperty("/Operation", "C");
        this.oModelOrder.setProperty("/ZET_lista_ordini/ImportoTot", sTotalCost);
        this.oModelOrder.setProperty("/ZET_lista_ordini/Stato", 1);
        const oPayload = this.oModelOrder.getData();
        console.log(oPayload);

        this.setBusy(true);

        try {
          const oResult = await this.createEntity("/ZES_DeepOrdiniSet", oPayload).then((data) => {
            MessageBox.success(this.getText("msgSuccessCreateOrder"), {
              actions: [MessageBox.Action.CLOSE],
              onClose: () => {
                this.navTo("ListaOrdini");
              },
            });
          });
        } catch (error) {
          console.error(error);
          MessageBox.error(error.message);
        } finally {
          this.setBusy(false);
        }
      },

      onAddItem: function () {
        if (!this._oAddDialog) {
          this._oAddDialog = sap.ui.xmlfragment("listaordini.view.ordini.fragment.AddArticoliDialog", this);
          this.getView().addDependent(this._oAddDialog);
        }

        this._loadSelectableItems();
        this._oAddDialog.open();
      },

      onRemoveItem: function () {
        if (this.getModel("Mode").getProperty("/isEdit")) {
          MessageToast.show(this.getText("msgLockModProduct"));
          return;
        }

        const oTable = this.byId("tblOrder");
        const aSelectedIndices = oTable.getSelectedIndices();
        if (!aSelectedIndices.length) {
          MessageToast.show(this.getText("msgWarningProduct"));
          return;
        }

        MessageBox.confirm(this.getText("msgInfoRemoveProduct"), {
          icon: sap.m.MessageBox.Icon.WARNING,
          title: this.getText("titleMessageBoxRemove"),
          actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
          emphasizedAction: MessageBox.Action.OK,
          onClose: (sAction) => {
            if (sAction !== MessageBox.Action.OK) {
              return;
            }

            const oModel = this.getModel("Ordine");
            const aItems = oModel.getProperty("/ZET_dettagli_ordiniSet");

            aSelectedIndices
              .sort((a, b) => b - a)
              .forEach((iIndex) => {
                if (aItems[iIndex]) {
                  aItems.splice(iIndex, 1);
                }
              });

            oModel.refresh(true);
            oTable.clearSelection();
            this._recalculateTotale();
            MessageToast.show(this.getText("msgSuccessRemoveProduct"));
          },
        });
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
        const aOrderItems = this.getModel("Ordine").getProperty("/ZET_dettagli_ordiniSet");

        aSelectedIndices.forEach((iIndex) => {
          const oItem = aSelectableData[iIndex];
          const bExists = aOrderItems.some((o) => o.CodArticolo === oItem.CodArticolo);
          if (!bExists) {
            aOrderItems.push({
              NumOrdine: 0,
              CodArticolo: oItem.CodArticolo,
              NomeArticolo: oItem.NomeArticolo,
              QuantitaOrdine: 1,
              Importo: oItem.Importo,
            });
          }
        });

        this.getModel("Ordine").refresh(true);

        this._recalculateTotale();
        oTable.clearSelection();
        this._oAddDialog.close();
      },

      _recalculateTotale: function () {
        const aData = this.getModel("Ordine").getProperty("/ZET_dettagli_ordiniSet") || [];
        const fTot = aData.reduce((sum, o) => {
          return sum + (Number(o.Importo) || 0);
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

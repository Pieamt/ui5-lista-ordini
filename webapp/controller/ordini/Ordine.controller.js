sap.ui.define(
  [
    "../BaseController",
    "sap/ui/model/json/JSONModel",
    "listaordini/util/generalUtils",
    "listaordini/util/entityUtils",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "listaordini/model/formatter",
  ],
  function (BaseController, JSONModel, generalUtils, entityUtils, MessageToast, MessageBox, formatter) {
    "use strict";

    const INIT_MODEL_DEEPORDINI = {
      Operation: "",
      NumOrdine: 0,
      ZET_lista_ordini: {
        NumOrdine: 0,
        Cliente: "",
        DataOrdine: "0000-00-00'T'00:00:00",
        ImportoTot: 0,
        Stato: 0,
        StatoTxt: "",
      },
      ZET_dettagli_ordiniSet: { results: [] },
    };

    const oStateModel = new JSONModel({
      states: [
        { key: "01", text: "Creato" },
        { key: "02", text: "In elaborazione" },
        { key: "03", text: "In transito" },
        { key: "04", text: "Chiuso" },
      ],
    });

    return BaseController.extend("listaordini.controller.ordini.Ordine", {
      formatter: formatter,
      onInit: function () {
        this.setModel(
          new JSONModel({
            isEdit: false,
            title: "",
          }),
          "Mode"
        );
        this.oModelTotalCost = this.setModel(new JSONModel({ costoTotale: 0 }), "CostoTotale");
        // this.oModelOrder = this.setModel(new JSONModel(INIT_MODEL_DEEPORDINI), "Ordine");
        this.getRouter().getRoute("NuovoOrdine").attachPatternMatched(this._onNew, this);
        this.getRouter().getRoute("DettaglioOrdine").attachPatternMatched(this._onEdit, this);
      },

      _onNew: function () {
        this.oModelOrder = this.setModel(new JSONModel(generalUtils.copyWithoutRef(INIT_MODEL_DEEPORDINI)), "Ordine");
        const mode = this.getModel("Mode");
        mode.setProperty("/title", "Nuovo Ordine");
        mode.setProperty("/isEdit", false);
      },

      _onEdit: async function (oEvent) {
        this.oModelOrder = this.setModel(new JSONModel(INIT_MODEL_DEEPORDINI), "Ordine");
        this.setModel(oStateModel, "States");
        const mode = this.getModel("Mode");
        mode.setProperty("/title", "Dettaglio Ordine");
        mode.setProperty("/isEdit", true);

        const sNumOrdine = oEvent.getParameter("arguments").NumOrdine;
        const oPayload = this.oModelOrder.getData();

        oPayload.Operation = "R";
        oPayload.NumOrdine = Number(sNumOrdine);
        oPayload.ZET_lista_ordini.NumOrdine = Number(sNumOrdine);
        oPayload.ZET_lista_ordini.DataOrdine = Number(oPayload.ZET_lista_ordini.DataOrdine);
        console.log("opay", oPayload);

        this.setBusy(true);

        try {
          const oResult = await this.createEntity("/ZES_DeepOrdiniSet", oPayload);
          this.oModelOrder.setProperty("/", oResult.data);
          console.log(this.oModelOrder.getData());
        } catch (error) {
          console.error(error);
          MessageBox.error(error.message);
        } finally {
          this.setBusy(false);
        }
      },

      onSave: async function () {
        const sMode = this.getModel("Mode").getData().isEdit;

        if (sMode === false) {
          const sTotalCost = this.oModelTotalCost.getProperty("/costoTotale");
          this.oModelOrder.setProperty("/Operation", "C");
          this.oModelOrder.setProperty("/ZET_lista_ordini/ImportoTot", sTotalCost);
          this.oModelOrder.setProperty("/ZET_lista_ordini/Stato", 1);
          const oPayload = this.oModelOrder.getData();
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
        } else {
          const oPayload = this.oModelOrder.getData();
          oPayload.Operation = "U";
          oPayload.ZET_lista_ordini.DataOrdine = NaN;
          oPayload.ZET_lista_ordini.Stato = Number(oPayload.ZET_lista_ordini.Stato);
          console.log(oPayload);
          this.setBusy(true);
          try {
            const oResult = await this.createEntity("/ZES_DeepOrdiniSet", oPayload).then((data) => {
              MessageBox.success(this.getText("msgSuccessUpdateOrder"), {
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
            const aItems = oModel.getProperty("/ZET_dettagli_ordiniSet/results");

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
        const aOrderItems = this.getModel("Ordine").getProperty("/ZET_dettagli_ordiniSet/results");
        console.log(aOrderItems);

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
        const aData = this.getModel("Ordine").getProperty("/ZET_dettagli_ordiniSet/results") || [];
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

sap.ui.define(
  [
    "../BaseController",
    "sap/ui/model/json/JSONModel",
    "listaordini/util/generalUtils",
    "listaordini/util/entityUtils",
    "sap/m/MessageBox",
    "listaordini/model/formatter",
  ],
  function (BaseController, JSONModel, generalUtils, entityUtils, MessageBox, formatter) {
    "use strict";

    const INIT_MODEL_PRODUCT = {
      CodArticolo: 0,
      NomeArticolo: "",
      Importo: 0,
      QuantitaDisp: 0,
    };

    return BaseController.extend("listaordini.controller.articoli.Articolo", {
      formatter: formatter,
      onInit: function () {
        this.setModel(
          new JSONModel({
            isEdit: false,
            title: "",
          }),
          "Mode"
        );

        this.getRouter().getRoute("NuovoArticolo").attachPatternMatched(this._onNew, this);
        this.getRouter().getRoute("ModificaArticolo").attachPatternMatched(this._onEdit, this);
      },

      _onNew: function () {
        const mode = this.getModel("Mode");
        mode.setProperty("/title", "Nuovo Articolo");
        mode.setProperty("/isEdit", false);
        this.oModelProduct = this.setModel(new JSONModel(generalUtils.copyWithoutRef(INIT_MODEL_PRODUCT)), "Articolo");
      },

      _onEdit: async function (oEvent) {
        const sCodArticolo = oEvent.getParameter("arguments").CodArticolo;
        const mode = this.getModel("Mode");
        mode.setProperty("/title", "Modifica Articolo");
        mode.setProperty("/isEdit", true);

        this.setBusy(true);

        try {
          const oResult = await this.getEntity("/ZES_articoliSet", { CodArticolo: sCodArticolo });
          const oArticolo = oResult.data;

          this.oModelProduct = this.setModel(new JSONModel(oArticolo), "Articolo");
        } catch (error) {
          console.error(error);
          MessageBox.error(error?.message);
        } finally {
          this.setBusy(false);
        }
      },

      onBack: function () {
        this.navTo("ListaArticoli");
      },

      onSave: async function (oEvent) {
        let oProduct = this.oModelProduct.getData();
        const mode = this.getModel("Mode").getProperty("/isEdit");

        if (mode === false) {
          this.setBusy(true);

          try {
            const oResult = await this.createEntity("/ZES_articoliSet", oProduct).then((data) => {
              MessageBox.success(this.getText("msgSuccessCreateProduct"), {
                actions: [sap.m.MessageBox.Action.CLOSE],
                onClose: () => {
                  this.navTo("ListaArticoli");
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
          this.setBusy(true);

          try {
            const oResult = await this.updateEntity(
              "/ZES_articoliSet",
              { CodArticolo: oProduct.CodArticolo },
              oProduct
            ).then((data) => {
              MessageBox.success(this.getText("msgSuccessUpdateProduct"), {
                actions: [sap.m.MessageBox.Action.CLOSE],
                onClose: () => {
                  this.navTo("ListaArticoli");
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
    });
  }
);

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
        this.getRouter().getRoute("Articolo").attachPatternMatched(this._onObjectMatched, this);
      },

      _onObjectMatched: function () {
        this.oModelProduct = this.setModel(new JSONModel(generalUtils.copyWithoutRef(INIT_MODEL_PRODUCT)), "Articolo");
      },

      onBack: function () {
        this.navTo("ListaArticoli");
      },

      onSave: async function () {
        let oProduct = this.oModelProduct.getData();

        this.setBusy(true);

        try {
          const oResult = await this.createEntity("/ZES_articoliSet", oProduct).then((data) => {
            MessageBox.success(this.getText(msgSuccessCreateProduct), {
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
      },
    });
  }
);

// @ts-check

sap.ui.define(
  ["sap/m/Button", "sap/ui/export/Spreadsheet", "sap/ui/export/library", "listaordini/util/exportUtils"],
  function (Button, Spreadsheet, exportLib, exportUtils) {
    "use strict";

    const EdmType = exportLib.EdmType;

    return Button.extend("listaordini.controls.ExportButton", {
      metadata: {
        properties: {
          tableId: { type: "string", defaultValue: null }, // Obbligatorio
          fileName: { type: "string", defaultValue: "export.xlsx" },
        },
      },

      init: function () {
        Button.prototype.init.call(this);
        this.setIcon("sap-icon://excel-attachment");
        this.setTooltip("Esporta");
      },

      onAfterRendering: function (oEvent) {
        if (!(this.mEventRegistry.press && this.mEventRegistry.press.length > 0)) {
          this.attachPress(this.onExportPress.bind(this));
        }
      },

      renderer: function (oRm, oButton) {
        sap.m.ButtonRenderer.render(oRm, oButton);
      },

      onExportPress: async function (aData) {
        try {
          const oTable = this._getTable();
          aData = this._getData(oTable);

          if (!aData.length) {
            sap.m.MessageBox.error("Nessun dato disponibile");
            return;
          }

          const aColumns = this._createColumnConfig(oTable.getColumns());
          await this._generateSpreadsheet(aColumns, aData);
        } catch (error) {
          sap.m.MessageBox.error(error.message);
        }
      },

      _getTable: function () {
        const sTableId = this.getTableId();
        let oTable = exportUtils.findComponentById(this, sTableId);

        if (!oTable) {
          oTable = this.getParent()?.getParent(); // Prova a recuperare la tabella dal contesto
        }

        if (!oTable) {
          throw new Error("Tabella non trovata");
        }

        return oTable;
      },

      _getData: function (oTable) {
        const oBinding = oTable.getBinding("rows");
        if (!oBinding) {
          return [];
        }

        const aData = oBinding.getModel()?.getProperty(oBinding.getPath());
        return Array.isArray(aData) ? aData : [];
      },

      _createColumnConfig: function (aColumns) {
        return aColumns.reduce((aConfig, oColumn) => {
          const sProperty = exportUtils.getFieldProperty(oColumn.getTemplate());
          const sLabel = oColumn?.getLabel()?.getText() || oColumn.getTemplate().data("label");

          if (!sProperty) return aConfig;

          const sType = exportUtils.getFieldType(oColumn.getTemplate()) || "default";
          const EDM_TYPE = sap.ui.export.EdmType;

          const configMap = {
            date: { type: EDM_TYPE.Date, format: "dd.mm.yyyy" },
            currency: { type: EDM_TYPE.Number, delimiter: true, scale: 2 },
            boolean: { type: EDM_TYPE.Boolean, trueValue: "X", falseValue: " " },
            time: { type: EDM_TYPE.Time },
            integer: { type: EDM_TYPE.Number },
            default: { type: EDM_TYPE.String },
          };

          aConfig.push({
            label: sLabel,
            property: sProperty,
            ...(configMap[sType] || configMap.default),
          });

          return aConfig;
        }, []);
      },

      _generateSpreadsheet: function (aColumns, aData) {
        return new Promise((resolve, reject) => {
          const oSheet = new Spreadsheet({
            workbook: { columns: aColumns },
            dataSource: aData,
            fileName: this._getFileName(),
          });

          oSheet
            .build()
            .then(resolve)
            .catch(reject)
            .finally(() => oSheet.destroy());
        });
      },

      _getFileName: function () {
        return this.getFileName().endsWith(".xlsx") ? this.getFileName() : `${this.getFileName()}.xlsx`;
      },
    });
  }
);

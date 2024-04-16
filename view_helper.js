const JsonFormatter = {
  syntaxHighlight: function (json) {
    json = json
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return json.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      function (match) {
        var cls = "number";
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = "key";
          } else {
            cls = "string";
          }
        } else if (/true|false/.test(match)) {
          cls = "boolean";
        } else if (/null/.test(match)) {
          cls = "null";
        }
        return '<span class="' + cls + '">' + match + "</span>";
      }
    );
  },
  prettyPrint: function (data) {
    return this.syntaxHighlight(JSON.stringify(data, undefined, 4));
  },
};

const DATATYPE_MAPPINGS = {
  string: "varchar",
  boolean: "tinyint(1)",
};

const ContentFormatter = {
  formatFieldAsRow: function (field) {
    const name = field.name;
    const not_null = field["null"] === false ? "" : "Yes";
    const default_value = field["default"] || "";
    const type = this.extractDataType(field);
    const notes = field.comment || "";
    const others = this.extractOptions(
      field,
      "precision",
      "scale",
      "collation"
    );
    return `<tr>
                    <td>${name}</td>
                    <td>${type}</td>
                    <td>${default_value}</td>
                    <td>${not_null}</td>
                    <td>${notes}</td>
                    <td>${others}</td>
                </tr>`;
  },
  formatIndexAsRow: function (index) {
    const name = index.name || "";
    const columns = (index.columns || []).join(", ");
    const unique = index.unique ? "Yes" : "";
    const notes = this.extractOptions(index, "order", "length", "where");
    return `<tr>
                    <td>${name}</td>
                    <td>${columns}</td>
                    <td>${unique}</td>
                    <td>${notes}</td>
                </tr>`;
  },
  formatForeignKeyAsRow: function (fk) {
    const name = fk.name || "";
    const fromColumn = fk.column;
    const toColumn = fk.toColumn;
    const toTable = fk.toTable;
    const notes = this.extractOptions(fk, "on_delete", "on_update", "validate");
    return `<tr>
                    <td>${name}</td>
                    <td>${fromColumn}</td>
                    <td>${toTable}</td>
                    <td>${toColumn}</td>
                    <td>${notes}</td>
                </tr>`;
  },
  extractOptions: function (field, ...options) {
    return options.reduce(
      (prev, option) =>
        `${prev}${option in field ? option + ": " + field[option] + "\n" : ""}`,
      ""
    );
  },
  extractDataType: function (field) {
    let type = field.type;
    if (["integer", "float", "decimal", "text", "string"].includes(type)) {
      const bytes = parseInt(field.limit) || (type === "string" ? 255 : "");
      const size = field.size || "";
      const unsigned = field.unsigned ? " unsigned" : "";
      if (type === "string") {
        type = "varchar";
      }
      return `${size}${type}${bytes ? "(" + bytes + ")" : ""}${unsigned}`;
    } else if (type === "boolean") {
      return "tinyint(1)";
    } else if (type === "primary_key") {
      return "bigint(20)";
    } else {
      return type;
    }
  },
};

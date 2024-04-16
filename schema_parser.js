// https://apidock.com/rails/ActiveRecord/ConnectionAdapters/SchemaStatements/create_table
// create_table "___,___do |t|___end
const CREATE_TABLE_REGEX =
  /(?<=create_table\s+)"(.*?)",?(.*?)do\s*\|t\|\s*([\s\S]*?)(?=\s*end(?:\s+|$))/g;
// https://apidock.com/rails/ActiveRecord/ConnectionAdapters/SchemaStatements/add_column
// t.___ "___",___
const COLUMN_TYPE_REGEX = /(?<=t\.)(\w+?)\s+"([^"]+?)"\s*(?:,\s*(.*)$|$)/gm;
// t.column "___", "___",___
const COLUMN_GENERAL_REGEX =
  /(?<=t\.column)\s+"([^"]+?)",\s+"([^"]+?)"\s*(?:,\s*(.*)$|$)/gm;
// https://apidock.com/rails/v6.1.7.7/ActiveRecord/ConnectionAdapters/SchemaStatements/add_index
// t.index ["___","___"],___
// t.index ["___"],___
const INDEX_REGEX = /(?<=t\.index)\s+(\[[\s\S]+?\])\s*(?:,\s*(.*)$|$)/gm;

// add_foreign_key "___", "___", ___
const FOREIGN_KEY_REGEX = /(?<=add_foreign_key\s+)"(.*?)",\s*"(.*?)",?(.*?)$/gm;

const SchemaParser = {
  parseSchema: function (schemaText) {
    let tables = {};
    schemaText.matchAll(CREATE_TABLE_REGEX).forEach((match) => {
      const [_, name, options, body] = match;

      const [fields, indexes, extraInfos] = this.parseTable(body, options);
      tables[name] = {
        ...extraInfos,
        fields: fields,
        indexes: indexes,
        foreignKeys: [],
      };
    });

    const fks = this.parseForeignKeys(schemaText);
    fks.forEach((fk) => {
      const { fromTable, toTable, ...extraInfos } = fk;
      if (tables[fromTable]) {
        tables[fromTable].foreignKeys.push({
          toTable: toTable,
          ...extraInfos,
        });
      } else {
        console.error(
          `ForeignKeys: Destination Table ${toTable} not found on add foreign key for table ${fromTable}`
        );
      }
    });

    return tables;
  },

  // https://apidock.com/rails/ActiveRecord/ConnectionAdapters/SchemaStatements/create_table
  parseTable: function (bodyText, optionsText) {
    const fields = this.parseFields(bodyText);
    const indexes = this.parseIndexes(bodyText);

    const {
      id = true,
      primary_key,
      ...extraInfos
    } = TokenParser.parseHash(optionsText);
    if (id) {
      let type = "primary_key";
      let options = {};
      if (typeof id === "string") {
        type = id;
      } else if (typeof id === "object") {
        options = id;
      }
      if (!primary_key) {
        // Add "id" column automatically
        fields.unshift({
          name: "id",
          type: type,
          nullable: false,
          comment: "AUTO_INCREMENT",
          ...options,
        });
        // Add unique index on id automatically
        indexes.unshift({
          columns: ["id"],
          unique: true,
          name: "PRIMARY_KEY",
        });
      } else {
        indexes.unshift({
          columns: primary_key instanceof Array ? primary_key : [primary_key],
          unique: true,
          name: "PRIMARY_KEY",
        });
      }
    }
    return [fields, indexes, extraInfos];
  },

  //https://apidock.com/rails/ActiveRecord/ConnectionAdapters/SchemaStatements/add_column
  parseFields: function (tableText) {
    const fields = [];

    // t.column "___", "___",___
    tableText.matchAll(COLUMN_GENERAL_REGEX).forEach((match) => {
      const [_, name, type, options] = match;
      const extraInfos = TokenParser.parseHash(options);
      fields.push({
        name: name,
        type: type,
        ...extraInfos,
      });
    });

    // t.___ "___",___
    tableText.matchAll(COLUMN_TYPE_REGEX).forEach((match) => {
      const [_, type, name, options] = match;
      const extraInfos = TokenParser.parseHash(options);
      fields.push({
        name: name,
        type: type,
        ...extraInfos,
      });
    });
    return fields;
  },

  parseIndexes: function (tableText) {
    const indexes = [];
    // t.index ["___","___"],___
    // t.index ["___"],___
    tableText.matchAll(INDEX_REGEX).forEach((match) => {
      const [_, array, options] = match;
      const columns = TokenParser.parseArray(array);
      const extraInfos = TokenParser.parseHash(options);
      indexes.push({
        columns: columns,
        ...extraInfos,
      });
    });
    return indexes;
  },

  // https://apidock.com/rails/ActiveRecord/ConnectionAdapters/SchemaStatements/add_foreign_key
  parseForeignKeys: function (schemaText) {
    const fks = [];
    schemaText.matchAll(FOREIGN_KEY_REGEX).forEach((match) => {
      const [_, fromTable, toTable, options] = match;
      const { column, primary_key, ...extraInfos } =
        TokenParser.parseHash(options);

      fks.push({
        fromTable: fromTable,
        toTable: toTable,
        column: column || `${pluralize.singular(toTable)}_id`,
        toColumn: primary_key || "id",
        ...extraInfos,
      });
    });
    return fks;
  },
};

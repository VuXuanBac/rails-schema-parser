// ============ Events =================
const DISPLAY_TYPE = ["raw", "schema"];
const FIELD_HEADERS = [
  "Field Name",
  "Data Type",
  "Default",
  "Not Null?",
  "Notes",
  "Others",
];
const INDEX_HEADERS = ["Index Name", "Column", "Unique?", "Notes"];
const FOREIGNKEY_HEADERS = [
  "Foreign Key",
  "Column",
  "Destination",
  "Destination Column",
  "Notes",
];

const LINK_TO_TABLE_CLASS = "table-name-item";

function populateFieldsToTable(table_name, data) {
  const fields_html = data.fields.reduce(
    (prev, field) => prev + ContentFormatter.formatFieldAsRow(field),
    ""
  );
  return `
    <span class="group-title">FIELDS</span>
    <table>
      <thead>
        <tr>
          ${FIELD_HEADERS.reduce(
            (prev, field) => prev + `<td>${field}</td>`,
            ""
          )}
        </tr>
      </thead>
      <tbody>
        ${fields_html}
      </tbody>
    </table>`;
}

function populateIndexesToTable(table_name, data) {
  const indexes_html = data.indexes.reduce(
    (prev, index) => prev + ContentFormatter.formatIndexAsRow(index),
    ""
  );

  return indexes_html
    ? `<span class="group-title">INDEXES</span>
      <table>
        <thead>
          <tr>
            ${INDEX_HEADERS.reduce(
              (prev, field) => prev + `<td>${field}</td>`,
              ""
            )}
          </tr>
        </thead>
        <tbody>
          ${indexes_html}
        </tbody>
      </table>`
    : "";
}

function populateForeignKeysToTable(table_name, data) {
  const fks_html = data.foreignKeys.reduce(
    (prev, fk) => prev + ContentFormatter.formatForeignKeyAsRow(fk),
    ""
  );
  return fks_html
    ? `<span class="group-title">FOREIGN KEYS</span>
        <table>
        <thead>
            <tr>
              ${FOREIGNKEY_HEADERS.reduce(
                (prev, field) => prev + `<td>${field}</td>`,
                ""
              )}
            </tr>
          </thead>
          <tbody>
            ${fks_html}
          </tbody>
        </table>`
    : "";
}

function populateData() {
  // Raw Parse
  const raw = SchemaParser.parseSchema(
    document.getElementById("schema-input").value
  );
  document.getElementById("raw-output").innerHTML =
    JsonFormatter.prettyPrint(raw);
  // Schema Detail
  let tables_html = "";
  for (const [table_name, data] of Object.entries(raw)) {
    tables_html += `<div class="table-item">
    <span class="table-name" id="table-${table_name}">${table_name}</span>
    ${populateFieldsToTable(table_name, data)}
    ${populateIndexesToTable(table_name, data)}
    ${populateForeignKeysToTable(table_name, data)}
  </div>`;
  }
  document.getElementById("schema-output").innerHTML = tables_html;
  // Table List
  let tables_list_html = Object.keys(raw).reduce(
    (prev, table_name) =>
      prev +
      `<li><a href="#table-${table_name}" class="${LINK_TO_TABLE_CLASS}">${table_name}</a></li>`,
    ""
  );
  document.getElementById(
    "navlinks"
  ).innerHTML = `<ul>${tables_list_html}</ul>`;
}

function displayOutput(type = "raw") {
  DISPLAY_TYPE.forEach((type) => {
    document.getElementById(`${type}-output`).style.display = "none";
  });
  document.getElementById(`${type}-output`).style.display = "unset";
}

document.addEventListener("input", (event) => {
  let target = event.target;
  target.style.height = 0;
  target.style.height = target.scrollHeight + "px";
  target.style.width = "100%";
});

document.addEventListener("change", (event) => {
  let target = event.target;
  if (target.id === "schema-input") {
    populateData();
  }
});

document.addEventListener("click", (event) => {
  let target = event.target;
  if (target.classList.contains(LINK_TO_TABLE_CLASS)) {
    displayOutput("schema");
  } else {
    DISPLAY_TYPE.forEach((type) => {
      if (`${type}-button` === target.id) {
        displayOutput(type);
      }
    });
  }
});

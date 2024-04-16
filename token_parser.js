// String -> Function -> Hash -> Array -> Number -> Keyword + Symbol
const VALUE_REGEX =
  /(['"])([^\1]*?)\1|(->\s*{.*})|{([^{}]+|{(?:[^{}]+|{[^{}]*})*})*}|\[([^\[\]]+|\[(?:[^\[\]]+|\[[^\[\]]*\])*\])*\]|(\d*\.?\d+)|:?([^",\b\s{}\[\]:]+)/g;

// { "___" | :___ => } | { ___: }
const HASH_KEY_REGEX =
  /(?:(['"])([^\1]*?)\1|:([\w_]+?))\s*=>\s*|([\w_]+?):\s*/g;

const RUBY_KEYWORDS = {
  true: true,
  false: false,
  nil: null,
};
const TokenParser = {
  _parseValueFromMatch: function (match) {
    if (match) {
      if (match[2]) {
        return [match[2], "string"];
      } else if (match[3]) {
        return [match[3], "function"];
      } else if (match[4]) {
        return [this.parseHash(match[4]), "hash"];
      } else if (match[5]) {
        return [this.parseArray(match[5]), "array"];
      } else if (match[6]) {
        return [
          match[6].startsWith(".") ? `0${match[6]}` : match[6],
          "numeric",
        ];
      } else if (match[7]) {
        let value = RUBY_KEYWORDS[match[7]];
        value = value === undefined ? match[7] : value;
        const type = match[7] in RUBY_KEYWORDS ? "keyword" : "symbol";
        return [value, type];
      }
    }
    return [];
  },
  parseArray: function (text) {
    const array = [];
    if (text) {
      let raw = text.trim();
      if (raw.startsWith("[")) {
        raw = raw.substring(1, raw.length - 1);
      }
      const regex = regexDeepClone(VALUE_REGEX);
      regex.lastIndex = 0;
      let match = null;
      while ((match = regex.exec(raw)) !== null) {
        let value = this._parseValueFromMatch(match)[0];
        if (value) {
          array.push(value);
        }
      }
    }
    return array;
  },
  parseHash: function (text) {
    const hash = {};
    if (text) {
      let raw = text.trim();
      if (raw.startsWith("{")) {
        raw = raw.substring(1, raw.length - 1);
      }
      let start = 0;
      let value = null;
      let key = null;
      const hashRegex = regexDeepClone(HASH_KEY_REGEX);
      const valueRegex = regexDeepClone(VALUE_REGEX);
      while (start < raw.length) {
        hashRegex.lastIndex = start;
        const key_match = hashRegex.exec(raw);
        key = key_match && (key_match[2] || key_match[3] || key_match[4]);
        if (key) {
          valueRegex.lastIndex = hashRegex.lastIndex;
          const value_match = valueRegex.exec(raw);
          value = this._parseValueFromMatch(value_match)[0];
        }
        if (key && value !== undefined) {
          hash[key] = value;
        } else {
          break;
        }
        start = valueRegex.lastIndex;
      }
    }
    return hash;
  },
};

function regexDeepClone(regex) {
  // Check if the input is a regular expression
  if (!(regex instanceof RegExp)) {
    throw new Error("Input is not a regular expression");
  }

  // Get the regex flags
  let flags = "";
  if (regex.global) flags += "g";
  if (regex.ignoreCase) flags += "i";
  if (regex.multiline) flags += "m";
  if (regex.sticky) flags += "y";
  if (regex.unicode) flags += "u";

  // Create a new regular expression using the constructor
  // with the same pattern and flags
  return new RegExp(regex.source, flags);
}

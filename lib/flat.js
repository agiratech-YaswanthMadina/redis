(function () {
    const traverseAndFlatten = (currentNode, target, flattenedKey = null) => {
      for (var key in currentNode) {
        if (currentNode.hasOwnProperty(key)) {
          var newKey = null;
          if (flattenedKey === null) {
            newKey = key;
          } else {
            newKey = flattenedKey + '.' + key;
          }
          var value = currentNode[key];
          if (value && typeof value === 'object' && !Array.isArray(value)) {
            traverseAndFlatten(value, target, newKey);
          } else {
            target[newKey] = value;
          }
        }
      }
    }
  
    module.exports = {
      falt: (data) => {
        var flattenedObject = {};
        traverseAndFlatten(data, flattenedObject);
        return flattenedObject;
      }
    }
  })()
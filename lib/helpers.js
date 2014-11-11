module.exports.checkMeta = function checkMeta(meta) {
    if (Object.prototype.toString.call(meta) === '[object Object]') {
        if (Object.keys(meta).length === 1) {
            try {
                JSON.stringify(meta);
            } catch (e) {
                return false;
            }
            return [Object.keys(meta)[0], meta[Object.keys(meta)[0]]];
        }
    }
    return false;
};
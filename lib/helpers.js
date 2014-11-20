/* ### function parseMeta (meta, [err])
###### @meta {Object} any meta data added to the message.
###### @err {Boolean} **Optional** if true we should look for an error object and exclude it to separate parameter
Function for parsing meta objects attached to the message
*/

module.exports.parseMeta = function parseMeta(meta, err) {
    var result,
        ex,
        key;
    if (Object.prototype.toString.call(meta) === '[object Object]') {
        for (key in meta) {
            if (meta[key] instanceof Error && err && !ex) {
                ex = meta[key];
                delete meta[key];
            }
        }
        try {
            result = JSON.stringify(meta);

            return {
                result: result,
                ex: ex
            };
        } catch (e) {
            throw new TypeError('Metadata should be valid JSON Object');
        }
    } else {
        throw new TypeError('Metadata should be valid JSON Object');
    }

};
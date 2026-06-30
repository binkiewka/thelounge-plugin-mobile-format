'use strict';

const fs = require('fs');

module.exports = {
    onServerStart(api) {
        api.Logger.info("Initializing Mobile Formatting plugin...");

        // Register client files
        api.PublicFiles.add("plugin.js");
        api.Stylesheets.addFile("plugin.css");

        // Monkey-patch fs.readFile to inject plugin.js script tag into index.html.tpl
        const originalReadFile = fs.readFile;
        fs.readFile = function(path, options, callback) {
            if (typeof path === 'string' && path.endsWith('client/index.html.tpl')) {
                let callbackToUse = callback;
                let optionsToUse = options;
                if (typeof options === 'function') {
                    callbackToUse = options;
                    optionsToUse = undefined;
                }
                return originalReadFile.call(fs, path, optionsToUse, (err, data) => {
                    if (err) {
                        return callbackToUse(err, data);
                    }
                    let content = typeof data === 'string' ? data : data.toString('utf8');
                    
                    // Inject script tag for plugin.js before the closing </body> tag
                    const scriptTag = '<script src="packages/thelounge-plugin-mobile-format/plugin.js"></script>';
                    if (!content.includes(scriptTag)) {
                        content = content.replace('</body>', `${scriptTag}\n</body>`);
                    }
                    
                    return callbackToUse(null, typeof data === 'string' ? content : Buffer.from(content, 'utf8'));
                });
            }
            return originalReadFile.apply(fs, arguments);
        };

        api.Logger.info("Mobile Formatting plugin successfully initialized.");
    }
};

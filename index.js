'use strict';

const fs = require('fs');

module.exports = {
    onServerStart(api) {
        api.Logger.info("Initializing Mobile Formatting plugin...");

        // Register client files
        api.PublicFiles.add("plugin.js");
        api.Stylesheets.addFile("plugin.css");

        // Monkey-patch fs.readFile and fs.readFileSync to inject plugin.js script tag into index.html/index.html.tpl
        const originalReadFile = fs.readFile;
        fs.readFile = function(path, options, callback) {
            const pathText = typeof path === 'string' ? path : String(path || '');
            if (pathText.endsWith('client/index.html.tpl') || pathText.endsWith('public/index.html')) {
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

        const originalReadFileSync = fs.readFileSync;
        fs.readFileSync = function(path, options) {
            const data = originalReadFileSync.apply(fs, arguments);
            const pathText = typeof path === 'string' ? path : String(path || '');
            if (pathText.endsWith('client/index.html.tpl') || pathText.endsWith('public/index.html')) {
                let content = typeof data === 'string' ? data : data.toString('utf8');
                const scriptTag = '<script src="packages/thelounge-plugin-mobile-format/plugin.js"></script>';
                if (!content.includes(scriptTag)) {
                    content = content.replace('</body>', `${scriptTag}\n</body>`);
                }
                return typeof data === 'string' ? content : Buffer.from(content, 'utf8');
            }
            return data;
        };

        api.Logger.info("Mobile Formatting plugin successfully initialized.");
    }
};

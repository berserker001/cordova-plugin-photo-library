var exec = require('cordova/exec');

var defaultThumbnailWidth = 512; // optimal for android
var defaultThumbnailHeight = 384; // optimal for android

var defaultQuality = 0.5;

var isBrowser = cordova.platformId == 'browser';

var photoLibrary = {};

// Will start caching for specified size
photoLibrary.getLibrary = function (success, error, options, partialCallback) {

    if (!options) {
        options = {};
    }

    options = {
        thumbnailWidth: options.thumbnailWidth || defaultThumbnailWidth,
        thumbnailHeight: options.thumbnailHeight || defaultThumbnailHeight,
        quality: options.quality || defaultQuality
    };

    cordova.exec(
        function (result) {

            var library = result.library;
            var isPartial = result.isPartial;

            //Do not need to support partial callback.

            // if (isPartial) {
            //     if (typeof partialCallback === 'function') {
            //         addUrlsToLibraryItem(library, partialCallback, options);
            //     }
            //     return;
            // }

            addUrlsToLibraryItem(library, options);

            library.sort(function (itemA, itemB) {
                return itemA.timestamp > itemB.timestamp;
            });

        },
        error,
        'PhotoLibrary',
        'getLibrary', [options]
    );

};

// Generates url that can be accessed directly, so it will work more efficiently than getThumbnail, which does base64 encode/decode.
// If success callback not provided, will return value immediately, but use overload with success as it browser-friendly
photoLibrary.getThumbnailURL = function (photoIdOrLibraryItem, success, error, options) {

    var photoId = typeof photoIdOrLibraryItem.id !== 'undefined' ? photoIdOrLibraryItem.id : photoIdOrLibraryItem;

    if (typeof success !== 'function' && typeof options === 'undefined') {
        options = success;
        success = undefined;
    }

    options = getThumbnailOptionsWithDefaults(options);

    var thumbnailURL = 'cdvphotolibrary://thumbnail?photoId=' + fixedEncodeURIComponent(photoId) +
        '&width=' + fixedEncodeURIComponent(options.thumbnailWidth) +
        '&height=' + fixedEncodeURIComponent(options.thumbnailHeight) +
        '&quality=' + fixedEncodeURIComponent(options.quality);

    if (success) {
        if (isBrowser) {
            cordova.exec(success, error, 'PhotoLibrary', '_getThumbnailURLBrowser', [photoId, options]);
        } else {
            success(thumbnailURL);
        }
    } else {
        return thumbnailURL;
    }

};

photoLibrary.getVideoThumbnailURL = function (libraryItem, success, error, options) {

    if (typeof success !== 'function' && typeof options === 'undefined') {
        options = success;
        success = undefined;
    }

    options = getThumbnailOptionsWithDefaults(options);

    var thumbnailURL = 'cdvphotolibrary://video?videoId=' + fixedEncodeURIComponent(libraryItem.nativeURL) +
        '&width=' + fixedEncodeURIComponent(options.thumbnailWidth) +
        '&height=' + fixedEncodeURIComponent(options.thumbnailHeight);

    if (success) {
        if (isBrowser) {
            cordova.exec(success, success, 'PhotoLibrary', '_getPhotoURLBrowser', [photoId, options]);
        } else {
            success(photoURL);
        }
        success(thumbnailURL);
    } else {
        return thumbnailURL;
    }
};

photoLibrary.getVideoPosterURL = function (libraryItem, success) {

    var posterURL = 'cdvphotolibrary://videoPoster?videoId=' + fixedEncodeURIComponent(libraryItem.nativeURL);

    if (success) {
        success(posterURL);
    } else {
        return posterURL;
    }

};

// Generates url that can be accessed directly, so it will work more efficiently than getPhoto, which does base64 encode/decode.
// If success callback not provided, will return value immediately, but use overload with success as it browser-friendly
photoLibrary.getPhotoURL = function (photoIdOrLibraryItem, success, error, options) {

    var photoId = typeof photoIdOrLibraryItem.id !== 'undefined' ? photoIdOrLibraryItem.id : photoIdOrLibraryItem;

    if (typeof success !== 'function' && typeof options === 'undefined') {
        options = success;
        success = undefined;
    }

    if (!options) {
        options = {};
    }

    var photoURL = 'cdvphotolibrary://photo?photoId=' + fixedEncodeURIComponent(photoId);

    if (success) {
        if (isBrowser) {
            cordova.exec(success, success, 'PhotoLibrary', '_getPhotoURLBrowser', [photoId, options]);
        } else {
            success(photoURL);
        }
    } else {
        return photoURL;
    }

};

// Provide same size as when calling getLibrary for better performance
photoLibrary.getThumbnail = function (photoIdOrLibraryItem, success, error, options) {

    var photoId = typeof photoIdOrLibraryItem.id !== 'undefined' ? photoIdOrLibraryItem.id : photoIdOrLibraryItem;

    options = getThumbnailOptionsWithDefaults(options);

    cordova.exec(
        function (data, mimeType) {
            if (!mimeType && data.data && data.mimeType) {
                // workaround for browser platform cannot return multipart result
                mimeType = data.mimeType;
                data = data.data;
            }
            var blob = new Blob([data], {
                type: mimeType
            });
            success(blob);
        },
        error,
        'PhotoLibrary',
        'getThumbnail', [photoId, options]
    );

};

photoLibrary.getPhoto = function (photoIdOrLibraryItem, success, error, options) {

    var photoId = typeof photoIdOrLibraryItem.id !== 'undefined' ? photoIdOrLibraryItem.id : photoIdOrLibraryItem;

    if (!options) {
        options = {};
    }

    cordova.exec(
        function (data, mimeType) {
            if (!mimeType && data.data && data.mimeType) {
                // workaround for browser platform cannot return multipart result
                mimeType = data.mimeType;
                data = data.data;
            }
            var blob = new Blob([data], {
                type: mimeType
            });
            success(blob);
        },
        error,
        'PhotoLibrary',
        'getPhoto', [photoId, options]
    );

};

// Call when thumbnails are not longer needed for better performance
photoLibrary.stopCaching = function (success, error) {

    cordova.exec(
        success,
        error,
        'PhotoLibrary',
        'stopCaching', []
    );

};

// Call when getting errors that begin with 'Permission Denial'
photoLibrary.requestAuthorization = function (success, error, options) {

    options = getRequestAuthenticationOptionsWithDefaults(options);

    cordova.exec(
        success,
        error,
        'PhotoLibrary',
        'requestAuthorization', [options]
    );

};

// url is file url or dataURL
photoLibrary.saveImage = function (url, album, success, error) {

    cordova.exec(
        success,
        error,
        'PhotoLibrary',
        'saveImage', [url, album]
    );

};

// url is file url or dataURL
photoLibrary.saveVideo = function (url, album, success, error) {

    cordova.exec(
        success,
        error,
        'PhotoLibrary',
        'saveVideo', [url, album]
    );

};

module.exports = photoLibrary;

var getThumbnailOptionsWithDefaults = function (options) {

    if (!options) {
        options = {};
    }

    options = {
        thumbnailWidth: options.thumbnailWidth || defaultThumbnailWidth,
        thumbnailHeight: options.thumbnailHeight || defaultThumbnailHeight,
        quality: options.quality || defaultQuality,
    };

    return options;

};

var getRequestAuthenticationOptionsWithDefaults = function (options) {

    if (!options) {
        options = {};
    }

    options = {
        read: options.read || true,
        write: options.write || false,
    };

    return options;

};

var addUrlsToLibraryItem = function (library, options) {

    for (var i = 0; i < library.length; i++) {

        var libraryItem = library[i];

        if (libraryItem.timestamp != null)
            libraryItem.timestamp = Math.abs(libraryItem.timestamp);

        if (libraryItem.duration != null) {
            libraryItem.isVideo = true;

            libraryItem.videoThumbnailURL = photoLibrary.getVideoThumbnailURL(libraryItem, null, null, options);
            libraryItem.videoPosterURL = photoLibrary.getVideoPosterURL(libraryItem, null);
        }
        else {

            libraryItem.thumbnailURL = photoLibrary.getThumbnailURL(libraryItem, null, null, options);
            libraryItem.photoURL = photoLibrary.getPhotoURL(libraryItem, null, null);
        }

    }

};

// from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent
function fixedEncodeURIComponent(str) {
    return encodeURIComponent(str).replace(/[!'()*]/g, function (c) {
        return '%' + c.charCodeAt(0).toString(16);
    });
}

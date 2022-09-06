const CGFloat = (Process.pointerSize === 4) ? 'float' : 'double';
const CGSize = [CGFloat, CGFloat];

export function ios(view) {
  return performOnMainThread(function () {
    const api = getApi();

    if (!view) {
      view = api.UIWindow.keyWindow();
    }

    const bounds = view.bounds();
    const size = bounds[1];
    api.UIGraphicsBeginImageContextWithOptions(size, 0, 0);


    const success = view.drawViewHierarchyInRect_afterScreenUpdates_(bounds, true);
    if (!success) {
      view.layer().renderInContext_(api.UIGraphicsGetCurrentContext());
    }

    const image = api.UIGraphicsGetImageFromCurrentImageContext();
    api.UIGraphicsEndImageContext();

    const png = new ObjC.Object(api.UIImagePNGRepresentation(image));
    return png.bytes().readByteArray(png.length());
  });
};

function performOnMainThread(action) {
  return new Promise(function (resolve, reject) {
    if (getApi().NSThread.isMainThread()) {
      performAction();
    } else {
      ObjC.schedule(ObjC.mainQueue, performAction);
    }

    function performAction() {
      try {
        const result = action();
        resolve(result);
      } catch (e) {
        reject(e);
      }
    }
  });
}

let cachedApi = null;
function getApi() {
  if (cachedApi === null) {
    cachedApi = {
      UIWindow: ObjC.classes.UIWindow,
      NSThread: ObjC.classes.NSThread,
      UIGraphicsGetCurrentContext: new NativeFunction(
        Module.findExportByName('UIKit', 'UIGraphicsGetCurrentContext'),
        'pointer', []),
      UIGraphicsBeginImageContextWithOptions: new NativeFunction(
          Module.findExportByName('UIKit', 'UIGraphicsBeginImageContextWithOptions'),
          'void', [CGSize, 'bool', CGFloat]),
      UIGraphicsEndImageContext: new NativeFunction(
          Module.findExportByName('UIKit', 'UIGraphicsEndImageContext'),
          'void', []),
      UIGraphicsGetImageFromCurrentImageContext: new NativeFunction(
          Module.findExportByName('UIKit', 'UIGraphicsGetImageFromCurrentImageContext'),
          'pointer', []),
      UIImagePNGRepresentation: new NativeFunction(
          Module.findExportByName('UIKit', 'UIImagePNGRepresentation'),
          'pointer', ['pointer'])
    };
  }
  return cachedApi;
}

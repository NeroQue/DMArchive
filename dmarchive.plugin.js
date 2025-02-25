/**
 * @name DMArchive
 * @author NeroQue
 * @description Archive DMs
 * @version 0.0.1
 */

module.exports = class DMArchive {
    start() {
      // Called when the plugin is activated (including after reloads)
      BdApi.alert("Hello World!", "This is my first plugin!");
    } 

    stop() {
      // Called when the plugin is deactivated
    }
}
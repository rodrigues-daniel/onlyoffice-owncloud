/**
 *
 * (c) Copyright Ascensio System SIA 2021
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

(function (OCA) {

    OCA.Onlyoffice = _.extend({
            AppName: "onlyoffice",
            context: null,
            folderUrl: null,
        }, OCA.Onlyoffice);

    OCA.Onlyoffice.setting = {};
    OCA.Onlyoffice.mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|BB|PlayBook|IEMobile|Windows Phone|Kindle|Silk|Opera Mini/i.test(navigator.userAgent);

    OCA.Onlyoffice.CreateFile = function (name, fileList, templateId) {
        var dir = fileList.getCurrentDirectory();

        if (!OCA.Onlyoffice.setting.sameTab || OCA.Onlyoffice.mobile || OCA.Onlyoffice.Desktop) {
            $loaderUrl = OCA.Onlyoffice.Desktop ? "" : OC.filePath(OCA.Onlyoffice.AppName, "templates", "loader.html");
            var winEditor = window.open($loaderUrl);
        }

        var createData = {
            name: name,
            dir: dir
        };

        if (templateId) {
            createData.templateId = templateId;
        }

        if ($("#isPublic").val()) {
            createData.shareToken = encodeURIComponent($("#sharingToken").val());
        }

        $.post(OC.generateUrl("apps/" + OCA.Onlyoffice.AppName + "/ajax/new"),
            createData,
            function onSuccess(response) {
                if (response.error) {
                    if (winEditor) {
                        winEditor.close();
                    }
                    OC.Notification.show(response.error, {
                        type: "error",
                        timeout: 3
                    });
                    return;
                }

                fileList.add(response, { animate: true });
                OCA.Onlyoffice.OpenEditor(response.id, dir, response.name, 0, winEditor);

                OCA.Onlyoffice.context = { fileList: fileList };
                OCA.Onlyoffice.context.fileName = response.name;

                OC.Notification.show(t(OCA.Onlyoffice.AppName, "File created"), {
                    timeout: 3
                });
            }
        );
    };

    OCA.Onlyoffice.OpenEditor = function (fileId, fileDir, fileName, version, winEditor) {
        var filePath = "";
        if (fileName) {
            filePath = fileDir.replace(new RegExp("\/$"), "") + "/" + fileName;
        }
        var url = OC.generateUrl("/apps/" + OCA.Onlyoffice.AppName + "/{fileId}?filePath={filePath}",
            {
                fileId: fileId,
                filePath: filePath
            });

        if ($("#isPublic").val()) {
            url = OC.generateUrl("apps/" + OCA.Onlyoffice.AppName + "/s/{shareToken}?fileId={fileId}",
                {
                    shareToken: encodeURIComponent($("#sharingToken").val()),
                    fileId: fileId
                });
        }

        if (version > 0) {
            url += "&version=" + version;
        }

        if (winEditor && winEditor.location) {
            winEditor.location.href = url;
        } else if (!OCA.Onlyoffice.setting.sameTab || OCA.Onlyoffice.mobile || OCA.Onlyoffice.Desktop) {
            winEditor = window.open(url, "_blank");
        } else if ($("#isPublic").val() === "1" && !$("#filestable").length) {
            location.href = url;
        } else {
            var $iframe = $("<iframe id=\"onlyofficeFrame\" nonce=\"" + btoa(OC.requestToken) + "\" scrolling=\"no\" allowfullscreen src=\"" + url + "&inframe=true\" />");
            if ($("#app-content").length) {
                $("#app-content").append($iframe);

                var scrollTop = $("#app-content").scrollTop();
                $("#onlyofficeFrame").css("top", scrollTop);
            } else {
                $("#preview").append($iframe);
            }

            $("body").addClass("onlyoffice-inline");
            OC.Apps.hideAppSidebar();

            $("html, body").scrollTop(0);

            OCA.Onlyoffice.folderUrl = location.href;
            window.history.pushState(null, null, url);
        }
    };

    OCA.Onlyoffice.CloseEditor = function () {
        $("body").removeClass("onlyoffice-inline");

        OCA.Onlyoffice.context = null;

        var url = OCA.Onlyoffice.folderUrl;
        if (!!url) {
            window.history.pushState(null, null, url);
            OCA.Onlyoffice.folderUrl = null;
        }

        OCA.Onlyoffice.bindVersionClick();
    };

    OCA.Onlyoffice.OpenShareDialog = function () {
        if (OCA.Onlyoffice.context) {
            if (!$("#app-content").hasClass("with-app-sidebar")) {
                OCA.Onlyoffice.context.fileList.showDetailsView(OCA.Onlyoffice.context.fileName, "shareTabView");
                OC.Apps.showAppSidebar();
            } else {
                OC.Apps.hideAppSidebar();
            }
        }
    };

    OCA.Onlyoffice.FileClick = function (fileName, context) {
        var fileInfoModel = context.fileInfoModel || context.fileList.getModelForFile(fileName);
        OCA.Onlyoffice.OpenEditor(fileInfoModel.id, context.dir, fileName);

        OCA.Onlyoffice.context = context;
        OCA.Onlyoffice.context.fileName = fileName;
    };

    OCA.Onlyoffice.FileConvertClick = function (fileName, context) {
        var fileInfoModel = context.fileInfoModel || context.fileList.getModelForFile(fileName);
        var fileList = context.fileList;

        var convertData = {
            fileId: fileInfoModel.id
        };

        if ($("#isPublic").val()) {
            convertData.shareToken = encodeURIComponent($("#sharingToken").val());
        }

        $.post(OC.generateUrl("apps/" + OCA.Onlyoffice.AppName + "/ajax/convert"),
            convertData,
            function onSuccess(response) {
                if (response.error) {
                    OC.Notification.show(response.error, {
                        type: "error",
                        timeout: 3
                    });
                    return;
                }

                if (response.parentId == fileList.dirInfo.id) {
                    fileList.add(response, { animate: true });
                }

                OC.Notification.show(t(OCA.Onlyoffice.AppName, "File has been converted. Its content might look different."), {
                    timeout: 3
                });
            });
    };

    OCA.Onlyoffice.DownloadClick = function (fileName, context) {
        var fileInfoModel = context.fileInfoModel || context.fileList.getModelForFile(fileName);

        $("#download-picker").remove();
        $.get(OC.filePath(OCA.Onlyoffice.AppName, "templates", "downloadPicker.html"), 
            function (tmpl) {
                var dialog = $(tmpl).octemplate({
                    dialog_name: "download-picker",
                    dialog_title: t("onlyoffice", "Download as")
                });

                $(dialog[0].querySelectorAll("p")).text(fileName + " " + t(OCA.Onlyoffice.AppName, "Convert into"));

                var extension = OCA.Onlyoffice.GetFileExtension(fileName);
                var selectNode = dialog[0].querySelectorAll("select")[0];
                var optionNodeOrigin = selectNode.querySelectorAll("option")[0];

                $(optionNodeOrigin).attr("data-value", extension);
                $(optionNodeOrigin).text(t(OCA.Onlyoffice.AppName, "Origin format"));

                dialog[0].dataset.format = extension;
                selectNode.onclick = function() {
                    dialog[0].dataset.format = $("#onlyoffice-download-select option:selected").attr("data-value");
                }

                OCA.Onlyoffice.setting.formats[extension].saveas.forEach(ext => {
                    var optionNode = optionNodeOrigin.cloneNode(true);

                    $(optionNode).attr("data-value", ext);
                    $(optionNode).text(ext);

                    selectNode.append(optionNode);
                })

                $("body").append(dialog)

                $("#download-picker").ocdialog({
                    closeOnEscape: true,
                    modal: true,
                    buttons: [{
                        text: t("core", "Cancel"),
                        classes: "cancel",
                        click: function() {
                            $(this).ocdialog("close")
                        }
                    }, {
                        text: t("onlyoffice", "Download"),
                        classes: "primary",
                        click: function() {
                            var format = this.dataset.format;
                            var fileId = fileInfoModel.id;
                            var downloadLink = OC.generateUrl("apps/" + OCA.Onlyoffice.AppName + "/downloadas?fileId={fileId}&toExtension={toExtension}",{
                                fileId: fileId,
                                toExtension: format
                            });

                            location.href = downloadLink;
                            $(this).ocdialog("close")
                        }
                    }]
                });
            });
    }

    OCA.Onlyoffice.GetSettings = function (callbackSettings) {
        if (OCA.Onlyoffice.setting.formats) {

            callbackSettings();

        } else {

            $.get(OC.generateUrl("apps/" + OCA.Onlyoffice.AppName + "/ajax/settings"),
                function onSuccess(settings) {
                    OCA.Onlyoffice.setting = settings;

                    callbackSettings();
                }
            );

        }
    };

    OCA.Onlyoffice.registerAction = function () {
        var register = function () {
            var formats = OCA.Onlyoffice.setting.formats;

            $.each(formats, function (ext, config) {
                if (!config.mime) {
                    return true;
                }
                OCA.Files.fileActions.registerAction({
                    name: "onlyofficeOpen",
                    displayName: t(OCA.Onlyoffice.AppName, "Open in ONLYOFFICE"),
                    mime: config.mime,
                    permissions: OC.PERMISSION_READ,
                    iconClass: "icon-onlyoffice-open",
                    actionHandler: OCA.Onlyoffice.FileClick
                });

                if (config.def) {
                    OCA.Files.fileActions.setDefault(config.mime, "onlyofficeOpen");
                }

                if (config.conv) {
                    OCA.Files.fileActions.registerAction({
                        name: "onlyofficeConvert",
                        displayName: t(OCA.Onlyoffice.AppName, "Convert with ONLYOFFICE"),
                        mime: config.mime,
                        permissions: ($("#isPublic").val() ? OC.PERMISSION_UPDATE : OC.PERMISSION_READ),
                        iconClass: "icon-onlyoffice-convert",
                        actionHandler: OCA.Onlyoffice.FileConvertClick
                    });
                }

                if (config.saveas && !$("#isPublic").val()) {
                    OCA.Files.fileActions.registerAction({
                        name: "onlyofficeDownload",
                        displayName: t(OCA.Onlyoffice.AppName, "Download as"),
                        mime: config.mime,
                        permissions: OC.PERMISSION_READ,
                        iconClass: "icon-onlyoffice-download",
                        actionHandler: OCA.Onlyoffice.DownloadClick
                    });
                }
            });
        }

        OCA.Onlyoffice.GetSettings(register);
    };

    OCA.Onlyoffice.NewFileMenu = {
        attach: function (menu) {
            var fileList = menu.fileList;

            if (fileList.id !== "files" && fileList.id !== "files.public") {
                return;
            }

            menu.addMenuEntry({
                id: "onlyofficeDocx",
                displayName: t(OCA.Onlyoffice.AppName, "Document"),
                templateName: t(OCA.Onlyoffice.AppName, "Document"),
                iconClass: "icon-onlyoffice-new-docx",
                fileType: "docx",
                actionHandler: function (name) {
                    if (!$("#isPublic").val() && OCA.Onlyoffice.TemplateExist("document")) {
                        OCA.Onlyoffice.OpenTemplatePicker(name, ".docx", "document");
                    } else {
                        OCA.Onlyoffice.CreateFile(name + ".docx", fileList);
                    }
                }
            });

            menu.addMenuEntry({
                id: "onlyofficeXlsx",
                displayName: t(OCA.Onlyoffice.AppName, "Spreadsheet"),
                templateName: t(OCA.Onlyoffice.AppName, "Spreadsheet"),
                iconClass: "icon-onlyoffice-new-xlsx",
                fileType: "xlsx",
                actionHandler: function (name) {
                    if (!$("#isPublic").val() && OCA.Onlyoffice.TemplateExist("spreadsheet")) {
                        OCA.Onlyoffice.OpenTemplatePicker(name, ".xlsx", "spreadsheet");
                    } else {
                        OCA.Onlyoffice.CreateFile(name + ".xlsx", fileList);
                    }
                }
            });

            menu.addMenuEntry({
                id: "onlyofficePpts",
                displayName: t(OCA.Onlyoffice.AppName, "Presentation"),
                templateName: t(OCA.Onlyoffice.AppName, "Presentation"),
                iconClass: "icon-onlyoffice-new-pptx",
                fileType: "pptx",
                actionHandler: function (name) {
                    if (!$("#isPublic").val() && OCA.Onlyoffice.TemplateExist("presentation")) {
                        OCA.Onlyoffice.OpenTemplatePicker(name, ".pptx", "presentation");
                    } else {
                        OCA.Onlyoffice.CreateFile(name + ".pptx", fileList);
                    }
                }
            });
        }
    };

    OCA.Onlyoffice.GetFileExtension = function (fileName) {
        var extension = fileName.substr(fileName.lastIndexOf(".") + 1).toLowerCase();
        return extension;
    };

    OCA.Onlyoffice.openVersion = function (fileId, version) {
        if ($("body").hasClass("onlyoffice-inline")) {
            $("#onlyofficeFrame")[0].contentWindow.OCA.Onlyoffice.onRequestHistory(version);
            return;
        }

        OCA.Onlyoffice.OpenEditor(fileId, "", "", version)
    };

    OCA.Onlyoffice.bindVersionClick = function () {
        OCA.Onlyoffice.unbindVersionClick();
        $(document).on("click.onlyoffice-version", "#versionsTabView .downloadVersion", function() {
            var ext = $("#app-sidebar .fileName h3").text().split(".").pop();
            if (!OCA.Onlyoffice.setting.formats[ext]
                || !OCA.Onlyoffice.setting.formats[ext].def) {
                return true;
            }

            var versionNodes = $("#versionsTabView ul.versions>li");
            var versionNode = $(this).closest("#versionsTabView ul.versions>li")[0];

            var href = $(this).attr("href");
            var search = new RegExp("\/meta\/(\\d+)\/v\/\\d+");
            var result = search.exec(href);
            if (result && result.length > 1) {
                var fileId = result[1];
            }

            var versionNum = versionNodes.length - $.inArray(versionNode, versionNodes);

            OCA.Onlyoffice.openVersion(fileId || "", versionNum);

            return false;
        });
    };

    OCA.Onlyoffice.unbindVersionClick = function() {
        $(document).off("click.onlyoffice-version", "#versionsTabView .downloadVersion");
    }

    var initPage = function () {
        if ($("#isPublic").val() === "1" && !$("#filestable").length) {
            var fileName = $("#filename").val();
            var extension = OCA.Onlyoffice.GetFileExtension(fileName);

            var initSharedButton = function () {
                var formats = OCA.Onlyoffice.setting.formats;

                var config = formats[extension];
                if (!config) {
                    return;
                }

                var button = document.createElement("a");
                button.href = OC.generateUrl("apps/" + OCA.Onlyoffice.AppName + "/s/" + encodeURIComponent($("#sharingToken").val()));
                button.className = "onlyoffice-public-open button";
                button.innerText = t(OCA.Onlyoffice.AppName, "Open in ONLYOFFICE")

                if (!OCA.Onlyoffice.setting.sameTab) {
                    button.target = "_blank";
                }

                $("#preview").prepend(button);
            };

            OCA.Onlyoffice.GetSettings(initSharedButton);
        } else {
            OC.Plugins.register("OCA.Files.NewFileMenu", OCA.Onlyoffice.NewFileMenu);

            OCA.Onlyoffice.registerAction();

            OCA.Onlyoffice.bindVersionClick();

            if (OCA.Onlyoffice.Share) {
                OCA.Onlyoffice.Share();
            }
        }
    };

    $(document).ready(initPage);

})(OCA);

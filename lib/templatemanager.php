<?php
/**
 *
 * (c) Copyright Ascensio System SIA 2020
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

namespace OCA\Onlyoffice;

use OCP\Files\Folder;

/**
 * Template manager
 *
 * @package OCA\Onlyoffice
 */
class TemplateManager {

    /**
     * Application name
     *
     * @var string
     */
    private static $appName = "onlyoffice";

    /**
     * Template folder name
     *
     * @var string
     */
    private static $templateFolderName = "template";

    /**
     * Get global template directory
     *
     * @return Folder
     */
    public static function GetGlobalTemplateDir() {
        $rootFolder = \OC::$server->getRootFolder();

        $appDir = $rootFolder->nodeExists(self::$appName) ? $rootFolder->get(self::$appName) : $rootFolder->newFolder(self::$appName);
        $templateDir = $appDir->nodeExists(self::$templateFolderName) ? $appDir->get(self::$templateFolderName) : $appDir->newFolder(self::$templateFolderName);

        return $templateDir;
    }

    /**
     * Get global templates
     *
     * @param string $mimetype - mimetype of the template
     *
     * @return array
     */
    public static function GetGlobalTemplates($mimetype = null) {
        $templateDir = self::GetGlobalTemplateDir();

        if (!empty($mimetype)) {
            $templatesList = $templateDir->searchByMime($mimetype);
        } else {
            $templatesList = $templateDir->getDirectoryListing();
        }

        return $templatesList;
    }

    /**
     * Get template file
     *
     * @param string $templateId - identifier file template
     *
     * @return File
     */
    public static function GetTemplate($templateId) {
        $logger = \OC::$server->getLogger();

        $templateDir = self::GetGlobalTemplateDir();
        try {
            $templates = $templateDir->getById($templateId);
        } catch(\Exception $e) {
            $logger->logException($e, ["message" => "GetTemplate: $templateId", "app" => self::$appName]);
            return null;
        }

        if (empty($templates)) {
            $logger->info("Template not found: $templateId", ["app" => self::$appName]);
            return null;
        }

        return $templates[0];
    }

    /**
     * Get type template from mimetype
     *
     * @param string $mime - mimetype
     *
     * @return string
     */
    public static function GetTypeTemplate($mime) {
        switch($mime) {
            case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                return "document";
            case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
                return "spreadsheet";
            case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
                return "presentation";
        }

        return "";
    }

    /**
     * Check template type
     *
     * @param string $name - template name
     *
     * @return bool
     */
    public static function IsTemplateType($name) {
        $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
        switch($ext) {
            case "docx":
            case "xlsx":
            case "pptx":
                return true;
        }

        return false;
    }

    /**
     * Get empty template content
     *
     * @param string $fileName - target file name
     *
     * @return string
     */
    public static function GetEmptyTemplate($fileName) {
        $ext = strtolower("." . pathinfo($fileName, PATHINFO_EXTENSION));
        $lang = \OC::$server->getL10NFactory("")->get("")->getLanguageCode();

        $templatePath = self::GetEmptyTemplatePath($lang, $ext);

        $template = file_get_contents($templatePath);
        return $template;
    }

    /**
     * Get template path
     *
     * @param string $lang - language
     * @param string $ext - file extension
     *
     * @return string
     */
    public static function GetEmptyTemplatePath($lang, $ext) {
        if (!array_key_exists($lang, self::$localPath)) {
            $lang = "en";
        }

        return dirname(__DIR__) . DIRECTORY_SEPARATOR . "assets" . DIRECTORY_SEPARATOR . self::$localPath[$lang] . DIRECTORY_SEPARATOR . "new" . $ext;
    }

    /**
     * Mapping local path to templates
     *
     * @var Array
     */
    private static $localPath = [
        "az" => "az-Latn-AZ",
        "bg_BG" => "bg-BG",
        "cs" => "cs-CZ",
        "de" => "de-DE",
        "de_DE" => "de-DE",
        "el" => "el-GR",
        "en" => "en-US",
        "en_GB" => "en-GB",
        "es" => "es-ES",
        "fr" => "fr-FR",
        "it" => "it-IT",
        "ja" => "ja-JP",
        "ko" => "ko-KR",
        "lv" => "lv-LV",
        "nl" => "nl-NL",
        "pl" => "pl-PL",
        "pt_BR" => "pt-BR",
        "pt_PT" => "pt-PT",
        "ru" => "ru-RU",
        "sk_SK" => "sk-SK",
        "sv" => "sv-SE",
        "uk" => "uk-UA",
        "vi" => "vi-VN",
        "zh_CN" => "zh-CN"
    ];
}
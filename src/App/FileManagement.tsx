import * as React from "react";

import { assertNever } from "assert-never";

import type { Result } from "../common/Functional/Result";
import { lookupSampleProgram } from "../SamplePrograms/SampleProgram";
import type { OpenFileSelection } from "../UI/CodeEditor/CodeEditorPanel";
import {
  ConfirmDiscardUnsavedFile,
  FileDialog,
  FileOpenError,
  FileSaveError,
} from "../UI/FileDialog";
import {
  loadFile,
  saveExistingFile,
  saveFileAs,
  type LoadedFile,
  type LoadedFileError,
} from "../UI/Files";
import type { UIStringKey } from "../UI/UIStrings";

export interface FileManagementInput {
  uiString: (key: UIStringKey) => string;
  asmText: string;
  setEditorCode: (asmText: string, binText: string) => void;
}

export interface FileManagementControls {
  loadedFileName: string | null;
  fileSaved: boolean;
  handleOpenFileRequest: (selection: OpenFileSelection) => void;
  handleSaveClick: () => void;
  handleSaveAsClick: () => void;
  setFileSaved: React.Dispatch<React.SetStateAction<boolean>>;
  fileDialogElems: React.JSX.Element;
}

export function useFileManagement(
  input: FileManagementInput,
): FileManagementControls {
  const { uiString, asmText, setEditorCode } = input;

  const [loadedFileError, setLoadedFileError] =
    React.useState<LoadedFileError | null>(null);
  const [saveFileError, setSaveFileError] = React.useState<string | null>(null);
  const [loadedFileName, setLoadedFileName] = React.useState<string | null>(
    null,
  );
  const [fileSaved, setFileSaved] = React.useState<boolean>(true);
  const [pendingOpenFileSelection, setPendingOpenFileSelection] =
    React.useState<OpenFileSelection | null>(null);
  const loadedFileHandleRef = React.useRef<FileSystemFileHandle | null>(null);

  const fileOpenChooser = React.useCallback(() => {
    loadFile((result: Result<LoadedFileError, LoadedFile>): void => {
      switch (result.kind) {
        case "Error":
          setLoadedFileError(result.error);
          break;
        case "Ok":
          loadedFileHandleRef.current = result.value.handle;
          if (loadedFileHandleRef.current !== null) {
            setLoadedFileName(result.value.fileName);
          } else {
            // This can happen in browsers that don't fully support the
            // FileSystem API.
            setLoadedFileName(null);
          }
          setFileSaved(true);
          switch (result.value.language) {
            case "VIC_ASSEMBLY":
              setEditorCode(result.value.contents, "");
              break;
            case "VIC_BINARY":
              setEditorCode("", result.value.contents);
              break;
            default:
              return assertNever(result.value.language);
          }
          break;
        default:
          return assertNever(result);
      }
    });
  }, [setEditorCode]);

  const loadSampleProgram = React.useCallback(
    (name: string): void => {
      const sampleProgram = lookupSampleProgram(name);
      if (sampleProgram !== null) {
        loadedFileHandleRef.current = null;
        setLoadedFileName(null);
        setFileSaved(true);
        setEditorCode(sampleProgram.code, "");
      }
    },
    [setEditorCode],
  );

  const doOpenFileRequest = React.useCallback(
    (selection: OpenFileSelection): void => {
      switch (selection.kind) {
        case "OpenFile":
          fileOpenChooser();
          break;
        case "CloseFile":
          loadedFileHandleRef.current = null;
          setLoadedFileName(null);
          setFileSaved(true);
          setEditorCode("", "");
          break;
        case "LoadSampleProgram":
          loadSampleProgram(selection.sample);
          break;
        default:
          assertNever(selection);
      }
    },
    [fileOpenChooser, loadSampleProgram, setEditorCode],
  );

  const handleOpenFileRequest = React.useCallback(
    (selection: OpenFileSelection): void => {
      if (fileSaved) {
        doOpenFileRequest(selection);
      } else {
        setPendingOpenFileSelection(selection);
      }
    },
    [doOpenFileRequest, fileSaved],
  );

  const handleCancelPendingOpenFile = React.useCallback(() => {
    setPendingOpenFileSelection(null);
  }, []);

  const handleContinuePendingOpenFile = React.useCallback(() => {
    if (pendingOpenFileSelection !== null) {
      doOpenFileRequest(pendingOpenFileSelection);
    }
    setPendingOpenFileSelection(null);
  }, [doOpenFileRequest, pendingOpenFileSelection]);

  const handleCloseLoadedFileError = React.useCallback((): void => {
    setLoadedFileError(null);
  }, []);

  const handleCloseSaveFileError = React.useCallback((): void => {
    setSaveFileError(null);
  }, []);

  const handleSaveClick = React.useCallback((): void => {
    if (loadedFileHandleRef.current !== null) {
      saveExistingFile(
        loadedFileHandleRef.current,
        asmText,
        (maybeError: string | null) => {
          if (maybeError !== null) {
            setSaveFileError(maybeError);
          } else {
            setFileSaved(true);
          }
        },
      );
    }
  }, [asmText]);

  const handleSaveAsClick = React.useCallback((): void => {
    saveFileAs(
      asmText,
      (
        handle: FileSystemFileHandle | null,
        maybeError: string | null,
      ): void => {
        if (maybeError !== null) {
          setSaveFileError(maybeError);
        } else {
          if (handle === null) {
            loadedFileHandleRef.current = null;
            setLoadedFileName(null);
          } else {
            loadedFileHandleRef.current = handle;
            setLoadedFileName(handle.name);
          }
          setFileSaved(true);
        }
      },
    );
  }, [asmText]);

  const fileDialogElems = (
    <>
      {loadedFileError !== null ? (
        <FileDialog
          title={uiString("ERROR")}
          onCloseClick={handleCloseLoadedFileError}
        >
          <FileOpenError
            fileName={loadedFileError.fileName}
            fileSize={loadedFileError.fileSize}
            error={loadedFileError.error}
            onCloseClick={handleCloseLoadedFileError}
          />
        </FileDialog>
      ) : null}
      {saveFileError !== null ? (
        <FileDialog
          title={uiString("ERROR")}
          onCloseClick={handleCloseSaveFileError}
        >
          <FileSaveError
            fileName={loadedFileName}
            error={saveFileError}
            onCloseClick={handleCloseSaveFileError}
          />
        </FileDialog>
      ) : null}
      {pendingOpenFileSelection !== null ? (
        <FileDialog
          title={uiString("WARNING")}
          onCloseClick={handleCancelPendingOpenFile}
        >
          <ConfirmDiscardUnsavedFile
            uiString={uiString}
            fileName={loadedFileName !== null ? loadedFileName : ""}
            onCancelClick={handleCancelPendingOpenFile}
            onContinueClick={handleContinuePendingOpenFile}
          />
        </FileDialog>
      ) : null}
    </>
  );

  return {
    loadedFileName,
    fileSaved,
    handleOpenFileRequest,
    handleSaveClick,
    handleSaveAsClick,
    setFileSaved,
    fileDialogElems,
  };
}

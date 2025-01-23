import "./App.css";

import * as React from "react";

import { assertNever } from "assert-never";

import type { Result } from "./common/Functional/Result";
import { parseVicBin } from "./common/VicBinParser";
import {
  compileVicProgram,
  prettyVicCompileResult,
} from "./common/VicLangFullCompiler";
import { loadProgram } from "./Computer/Program";
import { newSimulatorState } from "./Computer/SimulatorState";
import { newHelpScreenState, useHelpScreen } from "./HelpScreen";
import {
  getSampleProgramNames,
  lookupSampleProgram,
} from "./SamplePrograms/SampleProgram";
import { useSimulator, type SimulatorOptions } from "./Simulator";
import {
  CodeEditorPanel,
  type CodeEditorPanelHandle,
  type OpenFileSelection,
} from "./UI/CodeEditor/CodeEditorPanel";
import {
  ConfirmDiscardUnsavedFile,
  FileDialog,
  FileOpenError,
  FileSaveError,
} from "./UI/FileDialog";
import {
  loadFile,
  saveExistingFile,
  saveFileAs,
  type LoadedFile,
  type LoadedFileError,
} from "./UI/Files";
import { HelpScreen, HelpSidebar } from "./UI/HelpScreen";
import { Computer } from "./UI/Simulator/Computer";
import { Toolbar } from "./UI/Toolbar";
import { EnglishStrings } from "./UI/UIStrings";
import { WindowFrame } from "./UI/WindowFrame";

function App(): React.JSX.Element {
  const uiString = EnglishStrings;

  const initialState = React.useMemo(() => newSimulatorState(), []);

  const simulatorOptions: SimulatorOptions = {
    initialState: initialState,
  };
  const {
    computer,
    setComputer,
    cpuState,
    setCpuState,
    input,
    setInput,
    output,
    setOutput,
    animationSpeed,
    simulationState,
    isResetEnabled,
    computerRef,
    handleAnimationSpeedChange,
    handleFetchInstructionClick,
    handleExecuteInstructionClick,
    handleResetClick,
    handleSingleStepClick,
    handleRunClick,
    handleStopClick,
    handleClearClick,
    handleMemoryCellChange,
    handleInstructionRegister,
    handleInstructionRegisterEnterPressed,
    handleDataRegisterChange,
    handleProgramCounterChange,
    handleInputChange,
  } = useSimulator(simulatorOptions);

  const {
    helpScreenState,
    handleHelpClick,
    handleHelpScreenCloseClick,
    handleHelpScreenPinClick,
    handleHelpScreenUnpinClick,
  } = useHelpScreen(newHelpScreenState());

  const [codeEditorOpen, setCodeEditorOpen] = React.useState(false);
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

  const [asmText, setAsmText] = React.useState("");
  const [binText, setBinText] = React.useState("");

  const [asmBinSynced, setAsmBinSynced] = React.useState(false);

  const codeEditorPanelRef = React.useRef<CodeEditorPanelHandle>(null);

  const handleCodeEditorClick = React.useCallback((): void => {
    setCodeEditorOpen((open: boolean): boolean => !open);
  }, []);

  const handleCodeEditorClose = React.useCallback((): void => {
    setCodeEditorOpen(false);
  }, []);

  const handleAsmTextChange = React.useCallback((value: string): void => {
    setAsmText(value);
    setAsmBinSynced(false);
    setFileSaved(false);
  }, []);

  const handleBinTextChange = React.useCallback((value: string): void => {
    setBinText(value);
    setAsmBinSynced(false);
  }, []);

  const handleCompileClick = React.useCallback((): void => {
    const binSource = compileAsmToBinary(asmText);
    if (binSource === null) {
      if (codeEditorPanelRef.current !== null) {
        codeEditorPanelRef.current.pulseAsmEditor("ERROR");
      }
    } else {
      setBinText(binSource);
      setAsmBinSynced(true);
      if (codeEditorPanelRef.current !== null) {
        codeEditorPanelRef.current.pulseBinEditor("SUCCESS");
      }
    }
  }, [asmText]);

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
              setAsmText(result.value.contents);
              setBinText("");
              break;
            case "VIC_BINARY":
              setAsmText("");
              setBinText(result.value.contents);
              break;
            default:
              return assertNever(result.value.language);
          }
          setAsmBinSynced(false);
          break;
        default:
          return assertNever(result);
      }
    });
  }, []);

  const loadSampleProgram = React.useCallback((name: string): void => {
    const sampleProgram = lookupSampleProgram(name);
    if (sampleProgram !== null) {
      loadedFileHandleRef.current = null;
      setLoadedFileName(null);
      setFileSaved(true);
      setAsmText(sampleProgram.code);
      setBinText("");
      setAsmBinSynced(false);
    }
  }, []);

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
          setAsmText("");
          setBinText("");
          setAsmBinSynced(false);
          break;
        case "LoadSampleProgram":
          loadSampleProgram(selection.sample);
          break;
        default:
          assertNever(selection);
      }
    },
    [fileOpenChooser, loadSampleProgram],
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

  const handleLoadClick = React.useCallback((): void => {
    const result = parseVicBin(binText);
    switch (result.kind) {
      case "Error":
        if (codeEditorPanelRef.current !== null) {
          codeEditorPanelRef.current.pulseBinEditor("ERROR");
        }
        break;
      case "Ok": {
        const memory = result.value;
        const hardwareState = loadProgram(
          {
            computer: computer,
            cpuState: cpuState,
            input: input,
            output: output,
          },
          memory,
        );

        setComputer(hardwareState.computer);
        setCpuState(hardwareState.cpuState);
        setInput(hardwareState.input);
        setOutput(hardwareState.output);
        break;
      }
      default:
        return assertNever(result);
    }
  }, [
    binText,
    computer,
    cpuState,
    input,
    output,
    setComputer,
    setCpuState,
    setInput,
    setOutput,
  ]);

  const sampleProgramNames = React.useMemo<string[]>(
    () => getSampleProgramNames(),
    [],
  );

  return (
    <div className="App-Root">
      <Toolbar
        className="App-Toolbar-Cont"
        uiString={uiString}
        showCodeEditor={true}
        showThemeSwitcher={true}
        showSourceLoader={false}
        cpuState={cpuState}
        simulationState={simulationState}
        resetEnabled={isResetEnabled}
        onCodeEditorClick={handleCodeEditorClick}
        animationSpeed={animationSpeed}
        onAnimationSpeedChange={handleAnimationSpeedChange}
        onFetchInstructionClick={handleFetchInstructionClick}
        onExecuteInstructionClick={handleExecuteInstructionClick}
        onResetClick={handleResetClick}
        onSingleStepClick={handleSingleStepClick}
        onRunClick={handleRunClick}
        onStopClick={handleStopClick}
        onClearClick={handleClearClick}
        onHelpClick={handleHelpClick}
      />
      <div className="App-Main">
        {codeEditorOpen ? (
          <WindowFrame
            className="App-CodeEditor"
            title={uiString("CODE_EDITOR")}
            showCloseButton={true}
            onCloseClick={handleCodeEditorClose}
          >
            <CodeEditorPanel
              ref={codeEditorPanelRef}
              uiString={uiString}
              simulationState={simulationState}
              sampleProgramNames={sampleProgramNames}
              fileName={loadedFileName}
              fileSaved={fileSaved}
              onOpenFileRequest={handleOpenFileRequest}
              onSaveClick={handleSaveClick}
              onSaveAsClick={handleSaveAsClick}
              asmText={asmText}
              binText={binText}
              asmBinSynced={asmBinSynced}
              onAsmTextChange={handleAsmTextChange}
              onBinTextChange={handleBinTextChange}
              onCompileClick={handleCompileClick}
              onLoadClick={handleLoadClick}
            />
          </WindowFrame>
        ) : null}
        <WindowFrame
          className="App-Computer-WindowFrame"
          title={uiString("THE_VISUAL_COMPUTER")}
        >
          <Computer
            className="App-Computer"
            ref={computerRef}
            uiString={uiString}
            computer={computer}
            input={input}
            output={output}
            onMemoryCellChange={handleMemoryCellChange}
            onInstructionRegister={handleInstructionRegister}
            onInstructionRegisterEnterPressed={
              handleInstructionRegisterEnterPressed
            }
            onDataRegisterChange={handleDataRegisterChange}
            onProgramCounterChange={handleProgramCounterChange}
            onInputChange={handleInputChange}
          />
        </WindowFrame>
        {helpScreenState === "PINNED" ? (
          <div className="App-HelpSidebar-Cont">
            <HelpSidebar
              onCloseClick={handleHelpScreenCloseClick}
              onUnpinClick={handleHelpScreenUnpinClick}
            />
          </div>
        ) : null}
      </div>
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
      {helpScreenState === "OPEN" ? (
        <HelpScreen
          onCloseClick={handleHelpScreenCloseClick}
          onPinClick={handleHelpScreenPinClick}
        />
      ) : null}
    </div>
  );
}

function compileAsmToBinary(source: string): string | null {
  const compileResult = compileVicProgram(source);

  switch (compileResult.program.kind) {
    case "Error":
      return null;
    case "Ok": {
      const output = prettyVicCompileResult(
        compileResult.program.value,
        compileResult.statements,
      );
      let numExtraLines = numLines(source) - numLines(output);
      if (numExtraLines < 0) {
        numExtraLines = 0;
      }
      return output + "\n".repeat(numExtraLines);
    }
    default:
      return assertNever(compileResult.program);
  }
}

function numLines(str: string): number {
  const m = str.match(/\n/g);
  if (m === null) {
    return 0;
  }
  return m.length;
}

export default App;

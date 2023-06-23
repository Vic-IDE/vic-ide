import "../infra/test_bootstrap"; // eslint-disable-line @typescript-eslint/no-import-type-side-effects

import * as assert from "assert";
import * as vscode from "vscode";
import {
  simulatorGetSourceFile,
  waitForSimulatorReady,
} from "../../VicSimulator/VicSimulatorDebug";
import { vicLanguageId, vicOpenSimulatorCommand } from "../../ExtManifest";
import { getSimulatorManager } from "../../extension";
import { step } from "../infra/TestSteps";
import { testCase } from "../infra/TestCase";

export const run = testCase(async (): Promise<void> => {
  const simulatorManager = await step("Open Simulator", async () => {
    await vscode.commands.executeCommand(vicOpenSimulatorCommand);
    const simulatorManager = getSimulatorManager();
    await waitForSimulatorReady(simulatorManager);
    return simulatorManager;
  });

  await step("Open Text Document", async () => {
    const textDocument = await vscode.workspace.openTextDocument({
      language: vicLanguageId,
      content: "// Test file",
    });
    await vscode.window.showTextDocument(textDocument, vscode.ViewColumn.Two);
  });

  const sourceFile1 = await step("Get Source File 1", async () => {
    return await simulatorGetSourceFile(simulatorManager);
  });

  assert.deepStrictEqual<typeof sourceFile1>(sourceFile1, {
    filename: "Untitled-1",
    info: {
      kind: "ValidSourceFile",
      id: "untitled:Untitled-1",
      hasErrors: false,
    },
  });

  await step("Open Another Text Document", async () => {
    const textDocument = await vscode.workspace.openTextDocument({
      language: vicLanguageId,
      content: "// Test file",
    });
    await vscode.window.showTextDocument(textDocument, vscode.ViewColumn.Two);
  });

  const sourceFile2 = await step("Get Source File 2", async () => {
    return await simulatorGetSourceFile(simulatorManager);
  });

  assert.deepStrictEqual<typeof sourceFile2>(sourceFile2, {
    filename: "Untitled-2",
    info: {
      kind: "ValidSourceFile",
      id: "untitled:Untitled-2",
      hasErrors: false,
    },
  });

  await step("Close current editor", async () => {
    await vscode.commands.executeCommand("workbench.action.closeActiveEditor");
  });

  const sourceFile3 = await step("Get Source File 3", async () => {
    return await simulatorGetSourceFile(simulatorManager);
  });

  assert.deepStrictEqual<typeof sourceFile3>(sourceFile3, {
    filename: "Untitled-1",
    info: {
      kind: "ValidSourceFile",
      id: "untitled:Untitled-1",
      hasErrors: false,
    },
  });
});
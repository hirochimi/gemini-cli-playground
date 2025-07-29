/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { getErrorMessage } from '@google/gemini-cli-core';

/**
 * A simple logger class to handle file-based logging for a session.
 */
export class FileLogger {
  private readonly logFilePath: string;
  private initialized = false;
  private initializePromise: Promise<void> | null = null;

  constructor(workspaceRoot: string) {
    this.logFilePath = this.generateLogFileName(workspaceRoot);
  }

  private generateLogFileName(workspaceRoot: string): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return path.join(
      os.homedir(),
      '.gemini',
      'logs',
      path.basename(workspaceRoot),
      `gemini-cli-${year}${month}${day}-${hours}${minutes}.txt`,
    );
  }

  /**
   * Creates the log directory and file. This must be called before appending.
   */
  initialize(): Promise<void> {
    if (this.initializePromise) {
      return this.initializePromise;
    }

    this.initializePromise = (async () => {
      try {
        const directory = path.dirname(this.logFilePath);
        await fs.mkdir(directory, { recursive: true });
        await fs.writeFile(this.logFilePath, '');
        this.initialized = true;
      } catch (error) {
        // We can't use the logger to log an error about the logger,
        // so we console.error. This is a critical failure.
        console.error(
          `Failed to initialize log file at ${this.logFilePath}: ${getErrorMessage(error)}`,
        );
      }
    })();

    return this.initializePromise;
  }

  /**
   * Appends a string to the log file.
   * @param content The content to append.
   */
  async append(content: string): Promise<void> {
    if (!this.initialized) {
      await this.initializePromise;
      if (!this.initialized) return; // Initialization failed, do not log.
    }
    try {
      await fs.appendFile(this.logFilePath, content);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // Silently fail after the first error to avoid console spam.
      this.initialized = false;
    }
  }

  /**
   * Returns the full path to the log file.
   */
  getLogFilePath(): string {
    return this.logFilePath;
  }
}

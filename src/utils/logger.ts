type LogLevel = "debug" | "info" | "warn" | "error";

export class Logger {
  private static instance: Logger;
  private debugMode: boolean = false;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }

  private log(level: LogLevel, message: string, ...args: any[]): void {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;

    if (level === "debug" && !this.debugMode) {
      return;
    }

    switch (level) {
      case "debug":
      case "info":
        console.error(formattedMessage, ...args);
        break;
      case "warn":
        console.warn(formattedMessage, ...args);
        break;
      case "error":
        console.error(formattedMessage, ...args);
        break;
    }
  }

  debug(message: string, ...args: any[]): void {
    this.log("debug", message, ...args);
  }

  info(message: string, ...args: any[]): void {
    this.log("info", message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.log("warn", message, ...args);
  }

  error(message: string, ...args: any[]): void {
    this.log("error", message, ...args);
  }
}

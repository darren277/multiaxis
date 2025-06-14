export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'off';

/**
 * Centralised, toggleable logger.
 *
 *   import { Logger } from './config/logger';
 *   const log = new Logger('chemistry');   // <- drawing / module name
 *   log.info('initialised');
 */
export class Logger {
    /** runtime log level (default pulled from global setting) */
    //private static _globalLevel: LogLevel = (import.meta.env.VITE_LOG_LEVEL as LogLevel) || 'info';
    //private static _globalLevel: LogLevel = (__LOG_LEVEL__ as LogLevel) || 'info';
    private static _globalLevel: LogLevel = 'info'; // default level

    /** set once from each drawing instance */
    private readonly drawing: string;

    constructor(drawing: string) {
        this.drawing = drawing;
    }

    /* ---------------------------------------------------------------------- */
    /*  STATIC HELPERS                                                        */
    /* ---------------------------------------------------------------------- */
    /** Change level for every Logger that follows */
    public static setGlobalLevel(level: LogLevel) {
        Logger._globalLevel = level;
    }

    /** Quick helper for env‑style toggle (e.g. dev console) */
    public static enable()  { Logger.setGlobalLevel('debug'); }
    public static disable() { Logger.setGlobalLevel('off');   }

    /* ---------------------------------------------------------------------- */
    /*  INSTANCE METHODS                                                      */
    /* ---------------------------------------------------------------------- */
    debug = (msg: any, ...rest: any[]) => this._write('debug', msg, rest);
    info  = (msg: any, ...rest: any[]) => this._write('info',  msg, rest);
    warn  = (msg: any, ...rest: any[]) => this._write('warn',  msg, rest);
    error = (msg: any, ...rest: any[]) => this._write('error', msg, rest);

    /* ---------------------------------------------------------------------- */
    private _write(level: LogLevel, msg: any, rest: any[]) {
        if (!this._shouldLog(level)) return;

        const stamp = Logger._timestamp();
        const prefix = `[${stamp}:${level.toUpperCase()}:${this.drawing}]`;

        // map level → console fn
        (console as any)[level === 'debug' ? 'log' : level](prefix, msg, ...rest);
    }

    private _shouldLog(level: LogLevel) {
        const order: LogLevel[] = ['debug', 'info', 'warn', 'error', 'off'];
        return (
            order.indexOf(level) >=
            order.indexOf(Logger._globalLevel || 'info')
        );
    }

    private static _timestamp() {
        const d = new Date();
        return d.toISOString().replace('T', ' ').replace('Z', '');
    }
}

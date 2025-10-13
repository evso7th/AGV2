// public/worklets/bass-processor.js

/**
 * BassProcessor - это AudioWorklet, который генерирует звук баса.
 * Он управляется сообщениями из основного потока и выполняет синтез
 * в реальном времени в отдельном аудио-потоке для максимальной производительности.
 */
class BassProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super(options); // Обязательный вызов конструктора родительского класса
    this.sampleRate = options.processorOptions.sampleRate;
    this.activeNotes = new Map(); // Хранит активные ноты по их ID
    this.noteQueue = []; // Очередь запланированных событий
    this.enableLogging = true;

    this.port.onmessage = (event) => {
      this.handleMessage(event.data);
    };

    if (this.enableLogging) {
      console.log(`[Worklet] BassProcessor constructed. Sample rate: ${this.sampleRate}`);
    }
  }

  handleMessage(message) {
    // Логируем получение сообщения с точным временем из audio context
    if (this.enableLogging) {
      console.log(`[Worklet] Received ${message.type} for noteId ${message.noteId} at T=${currentTime.toFixed(2)} for when=${message.when.toFixed(2)}`);
    }

    if (message.type === 'clear') {
      this.activeNotes.clear();
      this.noteQueue = [];
      return;
    }

    if (isFinite(message.when)) {
      this.noteQueue.push(message);
      // Сортируем, чтобы всегда обрабатывать самое раннее событие
      this.noteQueue.sort((a, b) => a.when - b.when);
    }
  }

  // Основной цикл обработки аудио
  process(inputs, outputs, parameters) {
    const output = outputs[0];
    const outputChannel = output[0];

    // Обрабатываем очередь событий, время которых уже наступило
    while (this.noteQueue.length > 0 && this.noteQueue[0].when <= currentTime) {
      const message = this.noteQueue.shift();
      if (!message) continue;

      if (message.type === 'noteOn') {
        this.activeNotes.set(message.noteId, {
          frequency: message.frequency,
          phase: 0,
          gain: message.velocity,
          state: 'attack',
        });
      } else if (message.type === 'noteOff') {
        const note = this.activeNotes.get(message.noteId);
        if (note) {
          note.state = 'decay'; // Переводим ноту в состояние затухания
        }
      }
    }

    // Генерируем аудио сэмплы
    for (let i = 0; i < outputChannel.length; i++) {
      let sample = 0;

      // Итерируемся по всем активным нотам
      for (const [noteId, note] of this.activeNotes.entries()) {
        if (note.state === 'decay') {
          note.gain *= 0.999; // Простое экспоненциальное затухание
          if (note.gain < 0.001) {
            this.activeNotes.delete(noteId);
            continue; // Удаляем ноту и переходим к следующей
          }
        }
        
        // Простой синусоидальный осциллятор
        sample += Math.sin(note.phase) * note.gain;
        note.phase += (note.frequency * 2 * Math.PI) / this.sampleRate;
        if (note.phase >= 2 * Math.PI) {
          note.phase -= 2 * Math.PI;
        }
      }
      
      // Записываем сэмпл в выходной буфер, избегая клиппинга
      outputChannel[i] = Math.max(-1, Math.min(1, sample * 0.3));
    }
    
    // Этот return должен быть в конце функции process, а не внутри цикла!
    return true;
  }
}

registerProcessor('bass-processor', BassProcessor);

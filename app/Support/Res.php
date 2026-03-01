<?php
namespace App\Support;

use ArrayObject;

/**
 * @property string $message
 * @property bool $success
 */
class Res extends ArrayObject
{
  private bool $success = false;
  private string $message = '';
  function __construct(protected array $data = [])
  {
    $this->success = $data['success'] ?? false;
    $this->message = $data['message'] ?? '';
  }

  function __get($name): mixed
  {
    return $this->offsetGet($name);
  }

  function __set($name, $value): void
  {
    $this->offsetSet($name, $value);
  }

  function offsetExists(mixed $key): bool
  {
    return isset($this->data[$key]);
  }

  function offsetSet(mixed $key, mixed $value): void
  {
    if (is_null($key)) {
      $this->data[] = $value;
    } else {
      $this->data[$key] = $value;
    }
  }

  function offsetGet(mixed $key): mixed
  {
    // if (!isset($this->data[$key])) {
    //     return null;
    // }

    // $this->data[$key] = is_callable($this->data[$key])
    //     ? $this->data[$key]($this)
    //     : $this->data[$key];

    return $this->data[$key] ?? null;
  }

  public function offsetUnset(mixed $key): void
  {
    unset($this->data[$key]);
  }

  function isSuccessful()
  {
    return $this->success;
  }

  function isNotSuccessful()
  {
    return !$this->success;
  }

  function getMessage()
  {
    return $this->message;
  }

  public function toArray()
  {
    return $this->data;
  }
}

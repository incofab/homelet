<?php

test('the api health endpoint returns a successful response', function () {
    $response = $this->getJson('/api/health');

    $response->assertStatus(200)->assertJsonPath('success', true);
});

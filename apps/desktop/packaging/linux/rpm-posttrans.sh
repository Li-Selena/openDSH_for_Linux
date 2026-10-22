#!/bin/bash

# Release 1 removes integration in its old %postun during upgrades. Repair it
# after that script has run; the standard %post still handles initial setup.
if type update-alternatives >/dev/null 2>&1; then
    update-alternatives --install '/usr/bin/deepseek-harness' 'deepseek-harness' '/opt/DeepSeek Harness/deepseek-harness' 100 \
        || ln -sf '/opt/DeepSeek Harness/deepseek-harness' '/usr/bin/deepseek-harness'
else
    ln -sf '/opt/DeepSeek Harness/deepseek-harness' '/usr/bin/deepseek-harness'
fi

# Restore the AppArmor profile removed by the same legacy %postun, preserving
# electron-builder's parser compatibility and chroot checks.
if apparmor_status --enabled > /dev/null 2>&1; then
    APPARMOR_PROFILE_SOURCE='/opt/DeepSeek Harness/resources/apparmor-profile'
    APPARMOR_PROFILE_TARGET='/etc/apparmor.d/deepseek-harness'
    if apparmor_parser --skip-kernel-load --debug "$APPARMOR_PROFILE_SOURCE" > /dev/null 2>&1; then
        cp -f "$APPARMOR_PROFILE_SOURCE" "$APPARMOR_PROFILE_TARGET"
        if ! { [ -x '/usr/bin/ischroot' ] && /usr/bin/ischroot; } && hash apparmor_parser 2>/dev/null; then
            apparmor_parser --replace --write-cache --skip-read-cache "$APPARMOR_PROFILE_TARGET"
        fi
    fi
fi

exit 0

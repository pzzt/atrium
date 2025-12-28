# Version Display Fix - Setup Instructions

## Problem
The footer was showing `vdev` instead of the actual version number because Docker Hub automated builds use shallow git clones that don't have access to all tags, causing `git describe --tags` to fail.

## Solutions Implemented

### Solution 1: GitHub Actions Workflow (Recommended) ✅

A GitHub Actions workflow has been created that builds and pushes the Docker image with proper version detection.

**Setup Required:**

1. Go to: https://github.com/pzzt/atrium/settings/secrets/actions
2. Add the following secrets:
   - `DOCKER_USERNAME`: Your Docker Hub username
   - `DOCKER_PASSWORD`: Your Docker Hub password or access token
3. The workflow will automatically run on every push to `main` branch

**Benefits:**
- ✅ Reliably passes `SOURCE_COMMIT` as build argument
- ✅ Tags images with both `latest` and commit SHA (e.g., `5712eeb`)
- ✅ More control over the build process
- ✅ Build logs visible in GitHub Actions tab

**After setup:**
1. Push a commit (or manually trigger from Actions tab)
2. GitHub Actions will build and push to Docker Hub
3. Pull the new image: `docker pull pzzt/atrium:latest`
4. Verify version: `docker run --rm pzzt/atrium:latest cat /usr/share/nginx/html/version.js`
5. Restart deployment: `kubectl rollout restart deployment/atrium -n atrium`

---

### Solution 2: Docker Hub Build Hooks (Alternative)

A `hooks/build` file has been created to pass `SOURCE_COMMIT` to the Dockerfile. However, Docker Hub build hooks have known issues and may not execute reliably.

**If you want to use Docker Hub automated builds:**

1. Go to: https://hub.docker.com/r/pzzt/atrium/builds
2. Click "Build Settings" for your repository
3. Under "Build Context", ensure it's set to `/`
4. Under "Dockerfile Path", ensure it's `docker/Dockerfile`
5. In "Build Arguments", add:
   - Name: `SOURCE_COMMIT`
   - Value: `{SOURCE_COMMIT}` (Docker Hub will auto-replace this)

**Note:** This approach is less reliable than GitHub Actions due to Docker Hub's known issues with build hooks.

---

## Current Status

### Commits Made:
- `283ee8f`: Modify Dockerfile to auto-detect version from git tags
- `9039ed4`: Use `SOURCE_COMMIT` from Docker Hub instead of `git describe`
- `5712eeb`: Add `hooks/build` to pass `SOURCE_COMMIT` as build argument
- `bdc43af`: Add GitHub Actions workflow for reliable builds

### Files Modified:
- `docker/Dockerfile`: Modified to accept `SOURCE_COMMIT` build argument
- `hooks/build`: Created to pass build arguments (Docker Hub method)
- `.github/workflows/docker.yml`: Created for GitHub Actions method

---

## Verification Steps (After Either Solution)

1. **Pull new image:**
   ```bash
   docker pull pzzt/atrium:latest
   ```

2. **Check version locally:**
   ```bash
   docker run --rm pzzt/atrium:latest cat /usr/share/nginx/html/version.js
   ```
   Expected output: `window.APP_VERSION = "5712eeb";` (or similar 7-char commit SHA)

3. **Restart deployment:**
   ```bash
   kubectl rollout restart deployment/atrium -n atrium
   ```

4. **Verify in running pod:**
   ```bash
   kubectl exec -n atrium deployment/atrium -- cat /usr/share/nginx/html/version.js
   ```

5. **Check footer in browser:**
   - Open https://atrium.d.pzzt.dev
   - Footer should show `5712eeb` instead of `vdev`

---

## Technical Details

### Dockerfile Changes:
```dockerfile
# Accept build arguments
ARG SOURCE_COMMIT
ARG DOCKER_TAG=latest

# Use SOURCE_COMMIT if available, fallback to git describe, then "dev"
RUN if [ -n "$SOURCE_COMMIT" ]; then \
        VERSION="${SOURCE_COMMIT:0:7}"; \
    else \
        VERSION=$(git describe --tags --always 2>/dev/null || echo "dev"); \
    fi && \
    echo "window.APP_VERSION = \"${VERSION}\";" > /usr/share/nginx/html/version.js
```

### Why Git Describe Failed:
- Docker Hub automated builds use shallow clones (`--depth=1`)
- Shallow clones don't have full git history
- Without history, `git describe --tags` cannot find tags
- Result: Falls back to "dev"

### Why SOURCE_COMMIT Needs Build Hook:
- Docker Hub provides `SOURCE_COMMIT` as an **environment variable** during build
- Dockerfile `ARG` declarations expect **build arguments** (`--build-arg`)
- Environment variables are NOT automatically passed as build arguments
- Build hook explicitly bridges this gap with `--build-arg SOURCE_COMMIT=$SOURCE_COMMIT`

---

## References

- [Docker Hub Advanced Options](https://docs.docker.com/docker-hub/repos/manage/builds/advanced/)
- [GitHub Actions docker/build-push-action](https://github.com/docker/build-push-action)
- [Passing SOURCE_COMMIT to Dockerfile](https://stackoverflow.com/questions/59057978/passing-source-commit-to-dockerfile-commands-on-docker-hub)
